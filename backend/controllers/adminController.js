const asyncHandler = require("express-async-handler");
const User    = require("../models/User");
const Store   = require("../models/Store");
const Order   = require("../models/Order");
const Product = require("../models/Product");

// GET /api/admin/stats
const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalCustomers, totalVendors, totalStores,
    totalProducts,  totalOrders,  revenueAgg,
    bannedUsers,    inactiveStores,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "vendor" }),
    Store.countDocuments({}),
    Product.countDocuments({}),
    Order.countDocuments({}),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    User.countDocuments({ isActive: false, role: { $ne: "superadmin" } }),
    Store.countDocuments({ isActive: false }),
  ]);

  res.json({
    success: true,
    data: {
      totalCustomers,
      totalVendors,
      totalStores,
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      bannedUsers,
      inactiveStores,
    },
  });
});

// GET /api/admin/users?role=&status=&search=&page=1&limit=15
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 15 } = req.query;

  const filter = { role: { $ne: "superadmin" } };
  if (role && role !== "all") filter.role = role;
  if (status === "active")  filter.isActive = true;
  if (status === "banned")  filter.isActive = false;
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// GET /api/admin/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) { res.status(404); throw new Error("User not found"); }

  const [store, recentOrders] = await Promise.all([
    user.role === "vendor" ? Store.findOne({ owner: user._id }) : null,
    Order.find({ customer: user._id }).sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({ success: true, data: { user, store, recentOrders } });
});

// PUT /api/admin/users/:id/status  { isActive: true|false }
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  if (user.role === "superadmin") { res.status(403); throw new Error("Cannot modify superadmin"); }

  user.isActive = req.body.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? "activated" : "banned"}`, data: user });
});

// PUT /api/admin/users/:id/role  { role: "vendor"|"customer" }
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["vendor", "customer"].includes(role)) {
    res.status(400); throw new Error("Role must be vendor or customer");
  }

  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  if (user.role === "superadmin") { res.status(403); throw new Error("Cannot modify superadmin"); }

  user.role = role;
  await user.save();
  res.json({ success: true, message: `Role changed to ${role}`, data: user });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  if (user.role === "superadmin") { res.status(403); throw new Error("Cannot delete superadmin"); }

  await user.deleteOne();
  res.json({ success: true, message: "User deleted" });
});

// GET /api/admin/stores?status=&search=&page=1&limit=15
const adminGetAllStores = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 15 } = req.query;

  const filter = {};
  if (status === "active")   filter.isActive = true;
  if (status === "inactive") filter.isActive = false;
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }];

  const skip = (Number(page) - 1) * Number(limit);
  const [stores, total] = await Promise.all([
    Store.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Store.countDocuments(filter),
  ]);

  const storeIds = stores.map((s) => s._id);
  const productCounts = await Product.aggregate([
    { $match: { store: { $in: storeIds } } },
    { $group: { _id: "$store", count: { $sum: 1 } } },
  ]);
  const countMap = {};
  productCounts.forEach((p) => { countMap[p._id.toString()] = p.count; });

  const data = stores.map((s) => ({
    ...s.toObject(),
    productCount: countMap[s._id.toString()] || 0,
  }));

  res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// PUT /api/admin/stores/:id/status  { isActive: true|false }
const toggleStoreStatus = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) { res.status(404); throw new Error("Store not found"); }

  store.isActive = req.body.isActive;
  await store.save();
  res.json({ success: true, message: `Store ${store.isActive ? "activated" : "deactivated"}`, data: store });
});

// DELETE /api/admin/stores/:id
const adminDeleteStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) { res.status(404); throw new Error("Store not found"); }
  await store.deleteOne();
  res.json({ success: true, message: "Store deleted" });
});

// GET /api/admin/orders?status=&page=1&limit=15
const adminGetAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;

  const filter = {};
  if (status && status !== "all") filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("customer", "name email")
      .populate("store",    "name")
      .populate("vendor",   "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/admin/products?search=&storeId=&page=1&limit=15
const adminGetAllProducts = asyncHandler(async (req, res) => {
  const { search, storeId, page = 1, limit = 15 } = req.query;

  const filter = {};
  if (storeId && storeId !== "all") filter.store = storeId;
  if (search) {
    filter.$or = [
      { name:     { $regex: search, $options: "i" } },
      { sku:      { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("store",  "name")
      .populate("vendor", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/admin/stores/names — lightweight list for dropdowns
const adminGetStoreNames = asyncHandler(async (req, res) => {
  const stores = await Store.find({}).select("name isActive").sort({ name: 1 });
  res.json({ success: true, data: stores });
});

module.exports = {
  getAdminStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  adminGetAllStores,
  adminGetStoreNames,
  toggleStoreStatus,
  adminDeleteStore,
  adminGetAllOrders,
  adminGetAllProducts,
};
