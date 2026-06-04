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

// @desc    Get all users (Super Admin only)
// @route   GET /api/auth/users
// @access  Private/SuperAdmin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

// @desc    Update user active status (Super Admin only)
// @route   PUT /api/auth/users/:id/status
// @access  Private/SuperAdmin
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isActive = req.body.isActive;
  await user.save();

  res.json({ success: true, message: "User status updated", data: user });
});

module.exports = { registerUser, loginUser, getMe, updateProfile, updatePassword, getAllUsers, updateUserStatus };
