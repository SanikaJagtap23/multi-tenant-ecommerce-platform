const asyncHandler = require("express-async-handler");
const Order   = require("../models/Order");
const Product = require("../models/Product");
const Store   = require("../models/Store");
const User    = require("../models/User");
const Payment = require("../models/Payment");

// ─── CUSTOMER ────────────────────────────────────────────────────────────────

// POST /api/orders  (COD only — online payments go through /api/payments/intent)
const createOrder = asyncHandler(async (req, res) => {
  const { items, storeId, shippingAddress, paymentMethod, notes } = req.body;

  if (paymentMethod !== "cod") {
    res.status(400);
    throw new Error("Use /api/payments/intent for online payments.");
  }

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items in order.");
  }

  const store = await Store.findById(storeId).populate("owner");
  if (!store) {
    res.status(404);
    throw new Error("Store not found.");
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      image: product.images?.[0] || "",
    });

    subtotal += product.price * item.quantity;
    product.stock -= item.quantity;
    await product.save();
  }

  const tax         = parseFloat((subtotal * 0.1).toFixed(2));
  const shippingCost = subtotal >= 500 ? 0 : 49;
  const totalAmount  = parseFloat((subtotal + tax + shippingCost).toFixed(2));

  const order = await Order.create({
    customer: req.user._id,
    store:    store._id,
    vendor:   store.owner._id,
    items:    orderItems,
    subtotal,
    tax,
    shippingCost,
    totalAmount,
    shippingAddress,
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    status: "pending",
    notes: notes || "",
  });

  // Track COD payment record
  await Payment.create({
    user:    req.user._id,
    orders:  [order._id],
    paymentMethod: "cod",
    gateway: "cod",
    amount:   totalAmount,
    currency: "inr",
    status:   "pending",
  });

  res.status(201).json(order);
});

// GET /api/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate("store", "name logo")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("store", "name logo")
    .populate("customer", "name email")
    .populate("vendor", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  const id = req.user._id.toString();
  if (
    order.customer._id.toString() !== id &&
    order.vendor._id.toString() !== id &&
    req.user.role !== "superadmin"
  ) {
    res.status(403);
    throw new Error("Not authorised to view this order.");
  }

  res.json(order);
});

// ─── VENDOR ──────────────────────────────────────────────────────────────────

// GET /api/orders/vendor/orders
const getVendorOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = { vendor: req.user._id };
  if (status && status !== "all") query.status = status;

  const total  = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate("customer", "name email")
    .populate("store", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// PUT /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  if (
    order.vendor.toString() !== req.user._id.toString() &&
    req.user.role !== "superadmin"
  ) {
    res.status(403);
    throw new Error("Not authorised.");
  }

  // Restore stock on cancel
  if (status === "cancelled" && order.status !== "cancelled") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  order.status = status;

  // Auto-mark COD as paid on delivery
  if (status === "delivered" && order.paymentMethod === "cod" && order.paymentStatus === "unpaid") {
    order.paymentStatus = "paid";
    await Payment.findOneAndUpdate(
      { orders: order._id, gateway: "cod" },
      { status: "paid" }
    );
  }

  const updated = await order.save();
  res.json(updated);
});

// GET /api/orders/vendor/analytics
const getVendorAnalytics = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const now           = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
  const sevenDaysAgo  = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);

  const [totals] = await Order.aggregate([
    { $match: { vendor: vendorId } },
    {
      $group: {
        _id: null,
        totalRevenue:    { $sum: "$totalAmount" },
        paidRevenue:     { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
        totalOrders:     { $sum: 1 },
        uniqueCustomers: { $addToSet: "$customer" },
      },
    },
  ]).exec();

  const revenueByDay = await Order.aggregate([
    { $match: { vendor: vendorId, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).exec();

  const ordersByStatus = await Order.aggregate([
    { $match: { vendor: vendorId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).exec();

  const topProducts = await Order.aggregate([
    { $match: { vendor: vendorId } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", name: { $first: "$items.name" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }, unitsSold: { $sum: "$items.quantity" } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]).exec();

  const recentOrders = await Order.find({ vendor: vendorId })
    .populate("customer", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  const store = await Store.findOne({ owner: vendorId });
  let stockData = [], lowStock = [];
  if (store) {
    const products = await Product.find({ store: store._id }).select("name stock isActive images");
    stockData = products.map((p) => ({ name: p.name, stock: p.stock, isActive: p.isActive }));
    lowStock  = products.filter((p) => p.stock < 10 && p.isActive);
  }

  res.json({
    totals: {
      totalRevenue:    totals?.totalRevenue    || 0,
      paidRevenue:     totals?.paidRevenue     || 0,
      totalOrders:     totals?.totalOrders     || 0,
      uniqueCustomers: totals?.uniqueCustomers?.length || 0,
    },
    revenueByDay,
    ordersByStatus,
    topProducts,
    recentOrders,
    stockData,
    lowStock,
  });
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// GET /api/orders/admin/all
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status && status !== "all") query.status = status;

  const total  = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate("customer", "name email")
    .populate("store", "name")
    .populate("vendor", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/orders/admin/analytics
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const now           = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

  const [totals] = await Order.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 }, uniqueCustomers: { $addToSet: "$customer" } } },
  ]).exec();

  const revenueByDay = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).exec();

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).exec();

  const topStores = await Order.aggregate([
    { $group: { _id: "$store", revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    { $lookup: { from: "stores", localField: "_id", foreignField: "_id", as: "storeInfo" } },
    { $unwind: "$storeInfo" },
    { $project: { name: "$storeInfo.name", revenue: 1, orders: 1 } },
  ]).exec();

  const totalVendors   = await User.countDocuments({ role: "vendor" });
  const totalCustomers = await User.countDocuments({ role: "customer" });
  const totalStores    = await Store.countDocuments({ isActive: true });

  res.json({
    totals: {
      totalRevenue:    totals?.totalRevenue    || 0,
      totalOrders:     totals?.totalOrders     || 0,
      uniqueCustomers: totals?.uniqueCustomers?.length || 0,
      totalVendors,
      totalCustomers,
      totalStores,
    },
    revenueByDay,
    ordersByStatus,
    topStores,
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  updateOrderStatus,
  getAllOrders,
  getVendorAnalytics,
  getAdminAnalytics,
};
