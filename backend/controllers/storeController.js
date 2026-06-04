const asyncHandler = require("express-async-handler");
const Store = require("../models/Store");
const { uploadToCloudinary } = require("../config/cloudinary");

// @desc    Create a store
// @route   POST /api/stores
// @access  Private/Vendor
const createStore = asyncHandler(async (req, res) => {
  const { name, description, category, address, contactEmail, contactPhone } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error("Store name and category are required");
  }

  const existingStore = await Store.findOne({ owner: req.user._id });
  if (existingStore) {
    res.status(400);
    throw new Error("You already have a store. Only one store per vendor is allowed.");
  }

  const storeData = {
    name, description, category, address, contactEmail, contactPhone,
    owner: req.user._id,
  };

  if (req.file) {
    try {
      storeData.logo = await uploadToCloudinary(req.file.buffer, "stores");
    } catch (cloudErr) {
      console.error("Logo upload skipped:", cloudErr.message);
    }
  }

  const store = await Store.create(storeData);
  const populated = await store.populate("owner", "name email");
  res.status(201).json({ success: true, data: populated });
});

// @desc    Get vendor's own store
// @route   GET /api/stores/vendor/my-store
// @access  Private/Vendor
const getMyStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id }).populate("owner", "name email");
  // null data is a valid response — new vendors simply don't have a store yet
  res.json({ success: true, data: store || null });
});

// @desc    Get all active stores (public)
// @route   GET /api/stores
// @access  Public
const getAllStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({ isActive: true })
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: stores.length, data: stores });
});

// @desc    Get single store by ID
// @route   GET /api/stores/:id
// @access  Public
const getStoreById = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id).populate("owner", "name email");

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  res.json({ success: true, data: store });
});

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private/Vendor (own) or SuperAdmin
const updateStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  if (
    store.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "superadmin"
  ) {
    res.status(403);
    throw new Error("Not authorized to update this store");
  }

  const { name, description, category, address, contactEmail, contactPhone, isActive } = req.body;

  store.name = name || store.name;
  store.description = description !== undefined ? description : store.description;
  store.category = category || store.category;
  store.address = address !== undefined ? address : store.address;
  store.contactEmail = contactEmail !== undefined ? contactEmail : store.contactEmail;
  store.contactPhone = contactPhone !== undefined ? contactPhone : store.contactPhone;

  if (isActive !== undefined && req.user.role === "superadmin") {
    store.isActive = isActive;
  }

  if (req.file) {
    try {
      store.logo = await uploadToCloudinary(req.file.buffer, "stores");
    } catch (cloudErr) {
      console.error("Logo upload skipped:", cloudErr.message);
    }
  }

  const updated = await store.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete store (SuperAdmin only)
// @route   DELETE /api/stores/:id
// @access  Private/SuperAdmin
const deleteStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  await store.deleteOne();
  res.json({ success: true, message: "Store deleted successfully" });
});

// @desc    Get all stores including inactive (SuperAdmin only)
// @route   GET /api/stores/admin/all
// @access  Private/SuperAdmin
const adminGetAllStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({})
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: stores.length, data: stores });
});

module.exports = {
  createStore, getMyStore, getAllStores, getStoreById,
  updateStore, deleteStore, adminGetAllStores,
};
