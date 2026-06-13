const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User with this email already exists");
  }

  // Prevent self-registration as superadmin
  const assignedRole = role === "superadmin" ? "customer" : role || "customer";

  const user = await User.create({ name, email, password, role: assignedRole });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error("Account has been deactivated");
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    },
  });
});

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Update logged-in user profile (name, phone)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error("User not found"); }

  user.name  = req.body.name  ?? user.name;
  user.phone = req.body.phone ?? user.phone;

  const updated = await user.save();
  const payload = {
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    avatar: updated.avatar,
    phone: updated.phone,
    token: req.user.token,
  };
  res.json({ success: true, data: payload });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Please provide current and new password");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) { res.status(404); throw new Error("User not found"); }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) { res.status(400); throw new Error("Current password is incorrect"); }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
});

// ─── ADDRESSES ───────────────────────────────────────────────────────────────

// GET /api/auth/addresses
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");
  res.json({ success: true, data: user.addresses });
});

// POST /api/auth/addresses
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { label, fullName, email, phone, street, city, state, postalCode, country, isDefault } = req.body;

  if (!fullName || !street || !city || !state || !postalCode) {
    res.status(400);
    throw new Error("fullName, street, city, state, and postalCode are required");
  }

  const makeDefault = isDefault || user.addresses.length === 0;
  if (makeDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }

  user.addresses.push({ label: label || "Home", fullName, email: email || "", phone: phone || "", street, city, state, postalCode, country: country || "India", isDefault: makeDefault });
  await user.save();
  res.status(201).json({ success: true, data: user.addresses });
});

// PUT /api/auth/addresses/:addrId
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addrId);
  if (!addr) { res.status(404); throw new Error("Address not found"); }

  const { label, fullName, email, phone, street, city, state, postalCode, country, isDefault } = req.body;
  if (isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }

  if (label      !== undefined) addr.label      = label;
  if (fullName   !== undefined) addr.fullName   = fullName;
  if (email      !== undefined) addr.email      = email;
  if (phone      !== undefined) addr.phone      = phone;
  if (street     !== undefined) addr.street     = street;
  if (city       !== undefined) addr.city       = city;
  if (state      !== undefined) addr.state      = state;
  if (postalCode !== undefined) addr.postalCode = postalCode;
  if (country    !== undefined) addr.country    = country;
  if (isDefault  !== undefined) addr.isDefault  = isDefault;

  await user.save();
  res.json({ success: true, data: user.addresses });
});

// DELETE /api/auth/addresses/:addrId
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const idx = user.addresses.findIndex((a) => a._id.toString() === req.params.addrId);
  if (idx === -1) { res.status(404); throw new Error("Address not found"); }

  const wasDefault = user.addresses[idx].isDefault;
  user.addresses.splice(idx, 1);
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.json({ success: true, data: user.addresses });
});

module.exports = { registerUser, loginUser, getMe, updateProfile, updatePassword, getAddresses, addAddress, updateAddress, deleteAddress };
