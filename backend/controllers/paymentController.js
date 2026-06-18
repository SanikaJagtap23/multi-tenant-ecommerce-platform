const asyncHandler = require("express-async-handler");
const crypto  = require("crypto");
const Order   = require("../models/Order");
const Product = require("../models/Product");
const Store   = require("../models/Store");
const Payment = require("../models/Payment");
const Coupon  = require("../models/Coupon");
const { calcDiscount } = require("./couponController");

// ─── POST /api/payments/intent ────────────────────────────────────────────────
// Validates cart, reserves stock, creates pending orders, returns intentId.
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { storeGroups, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!storeGroups?.length) {
    res.status(400);
    throw new Error("No items in cart.");
  }

  let grandTotal = 0;
  const validatedGroups = [];

  for (const group of storeGroups) {
    const store = await Store.findById(group.storeId).populate("owner");
    if (!store) {
      res.status(404);
      throw new Error(`Store not found: ${group.storeId}`);
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of group.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        res.status(404);
        throw new Error(`Product not available: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
      }

      orderItems.push({
        product: product._id,
        name:     product.name,
        quantity: item.quantity,
        price:    product.price,
        image:    product.images?.[0] || "",
      });

      subtotal       += product.price * item.quantity;
      product.stock  -= item.quantity;  // reserve stock
      await product.save();
    }

    const tax          = parseFloat((subtotal * 0.1).toFixed(2));
    const shippingCost = subtotal >= 500 ? 0 : 49;

    // Apply coupon if provided and valid for this store
    let couponDiscount = 0;
    let appliedCoupon  = null;
    if (couponCode) {
      const now    = new Date();
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (
        coupon &&
        coupon.store.toString() === store._id.toString() &&
        coupon.expiryDate > now &&
        (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) &&
        subtotal >= coupon.minOrderAmount
      ) {
        couponDiscount = parseFloat(calcDiscount(coupon, subtotal).toFixed(2));
        appliedCoupon  = coupon;
      }
    }

    const totalAmount = parseFloat((subtotal + tax + shippingCost - couponDiscount).toFixed(2));
    grandTotal       += totalAmount;

    validatedGroups.push({ store, orderItems, subtotal, tax, shippingCost, couponDiscount, appliedCoupon, totalAmount });
  }

  grandTotal = parseFloat(grandTotal.toFixed(2));

  // Generate a dummy payment intent ID (no external gateway needed)
  const intentId = `pi_${crypto.randomBytes(16).toString("hex")}`;

  // Create one pending order per store
  const orderIds = [];
  for (const group of validatedGroups) {
    const order = await Order.create({
      customer:     req.user._id,
      store:        group.store._id,
      vendor:       group.store.owner._id,
      items:        group.orderItems,
      subtotal:     group.subtotal,
      tax:          group.tax,
      shippingCost: group.shippingCost,
      totalAmount:  group.totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus:   "unpaid",
      status:          "payment_pending",
      stripePaymentId: intentId,
      couponCode:      group.appliedCoupon ? group.appliedCoupon.code : "",
      couponDiscount:  group.couponDiscount,
    });
    orderIds.push(order._id);

    if (group.appliedCoupon) {
      group.appliedCoupon.usedCount += 1;
      await group.appliedCoupon.save();
    }
  }

  // Payment record
  await Payment.create({
    user:    req.user._id,
    orders:  orderIds,
    paymentMethod,
    gateway: "dummy",
    stripePaymentIntentId: intentId,
    amount:   grandTotal,
    currency: "inr",
    status:   "pending",
  });

  res.json({ intentId, orderIds, total: grandTotal });
});

// ─── POST /api/payments/confirm/:intentId ─────────────────────────────────────
// Called after successful dummy payment on frontend.
const confirmPayment = asyncHandler(async (req, res) => {
  const { intentId } = req.params;

  const pendingOrders = await Order.find({
    stripePaymentId: intentId,
    customer: req.user._id,
    status: "payment_pending",
  });

  if (!pendingOrders.length) {
    // Already confirmed (idempotent) — just return current orders
    const orders = await Order.find({ stripePaymentId: intentId, customer: req.user._id })
      .populate("store", "name logo");
    return res.json({ success: true, orders });
  }

  await Order.updateMany(
    { stripePaymentId: intentId, customer: req.user._id, status: "payment_pending" },
    { status: "pending", paymentStatus: "paid" }
  );

  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: intentId },
    { status: "paid" }
  );

  const orders = await Order.find({ stripePaymentId: intentId, customer: req.user._id })
    .populate("store", "name logo");

  res.json({ success: true, orders });
});

// ─── POST /api/payments/fail/:intentId ────────────────────────────────────────
// Called after failed dummy payment — restores stock, marks orders failed.
const failPayment = asyncHandler(async (req, res) => {
  const { intentId } = req.params;
  const { reason = "Payment failed" } = req.body;

  await _failOrders(intentId, req.user._id, reason);
  res.json({ success: true });
});

// ─── GET /api/payments/my ─────────────────────────────────────────────────────
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate({ path: "orders", populate: { path: "store", select: "name logo" } })
    .sort({ createdAt: -1 });
  res.json(payments);
});

// ─── Internal helper: fail orders + restore stock ─────────────────────────────
async function _failOrders(stripePaymentIntentId, customerId, reason) {
  const orders = await Order.find({
    stripePaymentId: stripePaymentIntentId,
    customer: customerId,
    status: "payment_pending",
  });

  for (const order of orders) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    order.status        = "payment_failed";
    order.paymentStatus = "failed";
    await order.save();
  }

  await Payment.findOneAndUpdate(
    { stripePaymentIntentId },
    { status: "failed", failureReason: reason }
  );
}

module.exports = { createPaymentIntent, confirmPayment, failPayment, getMyPayments, _failOrders };
