const asyncHandler = require("express-async-handler");
const Coupon = require("../models/Coupon");
const Store  = require("../models/Store");

// ─── Helper ───────────────────────────────────────────────────────────────────

const calcDiscount = (coupon, subtotal) => {
  if (coupon.type === "flat") {
    return Math.min(coupon.discountValue, subtotal);
  }
  const raw = (subtotal * coupon.discountValue) / 100;
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
};

// ─── VENDOR ──────────────────────────────────────────────────────────────────

// GET /api/coupons/mine
const getVendorCoupons = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    res.status(404);
    throw new Error("You don't have a store yet.");
  }

  const coupons = await Coupon.find({ store: store._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: coupons });
});

// POST /api/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, discountValue, minOrderAmount, maxDiscount, expiryDate, usageLimit } = req.body;

  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    res.status(404);
    throw new Error("You don't have a store yet.");
  }

  if (type === "percent" && discountValue > 100) {
    res.status(400);
    throw new Error("Percent discount cannot exceed 100.");
  }

  const coupon = await Coupon.create({
    code,
    type,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscount:    maxDiscount    || null,
    expiryDate,
    usageLimit:     usageLimit     || null,
    store:     store._id,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: coupon });
});

// DELETE /api/coupons/:id
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) { res.status(404); throw new Error("Coupon not found."); }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store || coupon.store.toString() !== store._id.toString()) {
    res.status(403);
    throw new Error("Not authorised to delete this coupon.");
  }

  await coupon.deleteOne();
  res.json({ success: true, message: "Coupon deleted." });
});

// PUT /api/coupons/:id/toggle
const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) { res.status(404); throw new Error("Coupon not found."); }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store || coupon.store.toString() !== store._id.toString()) {
    res.status(403);
    throw new Error("Not authorised.");
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json({ success: true, data: coupon });
});

// ─── CUSTOMER ────────────────────────────────────────────────────────────────

// GET /api/coupons/validate?code=SAVE10&storeId=xxx&subtotal=1000
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, storeId, subtotal } = req.query;

  if (!code || !storeId || !subtotal) {
    res.status(400);
    throw new Error("code, storeId, and subtotal are required.");
  }

  const now = new Date();
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error("Invalid or inactive coupon code.");
  }
  if (coupon.store.toString() !== storeId) {
    res.status(400);
    throw new Error("This coupon is not valid for this store.");
  }
  if (coupon.expiryDate < now) {
    res.status(400);
    throw new Error("This coupon has expired.");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("This coupon has reached its usage limit.");
  }

  const sub = parseFloat(subtotal);
  if (sub < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}.`);
  }

  const discountAmount = parseFloat(calcDiscount(coupon, sub).toFixed(2));

  res.json({
    success: true,
    data: {
      code:           coupon.code,
      type:           coupon.type,
      discountValue:  coupon.discountValue,
      maxDiscount:    coupon.maxDiscount,
      discountAmount,
    },
  });
});

module.exports = {
  getVendorCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
  calcDiscount,
};
