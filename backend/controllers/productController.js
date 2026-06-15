const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Store = require("../models/Store");
const { uploadToCloudinary } = require("../config/cloudinary");

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Vendor
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, comparePrice, category, stock, sku, variants } = req.body;

  if (!name || !price || !category) {
    res.status(400);
    throw new Error("Name, price, and category are required");
  }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    res.status(404);
    throw new Error("You must create a store before adding products");
  }

  const productData = {
    name,
    description,
    price: Number(price),
    comparePrice: Number(comparePrice) || 0,
    category,
    stock: Number(stock) || 0,
    sku,
    store: store._id,
    vendor: req.user._id,
  };

  if (variants) {
    productData.variants = typeof variants === "string" ? JSON.parse(variants) : variants;
  }

  if (req.files && req.files.length > 0) {
    try {
      const uploads = req.files.map((f) => uploadToCloudinary(f.buffer, "products"));
      productData.images = await Promise.all(uploads);
    } catch (cloudErr) {
      console.error("Product image upload skipped:", cloudErr.message);
    }
  }

  const product = await Product.create(productData);
  res.status(201).json({ success: true, data: product });
});

// @desc    Get all products for vendor's store
// @route   GET /api/products/vendor/my-products
// @access  Private/Vendor
const getMyProducts = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  // No store yet — return empty list, not an error
  if (!store) {
    return res.json({ success: true, count: 0, data: [] });
  }

  const products = await Product.find({ store: store._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: products.length, data: products });
});

// @desc    Get all active products (public browsing)
// @route   GET /api/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  const { category, storeId, search, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };

  if (category) filter.category = { $regex: category, $options: "i" };
  if (storeId) filter.store = storeId;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("store", "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products,
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("store", "name category contactEmail")
    .populate("vendor", "name");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ success: true, data: product });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Vendor (own) or SuperAdmin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (
    product.vendor.toString() !== req.user._id.toString() &&
    req.user.role !== "superadmin"
  ) {
    res.status(403);
    throw new Error("Not authorized to update this product");
  }

  const { name, description, price, comparePrice, category, stock, sku, isActive, variants } = req.body;

  product.name = name || product.name;
  product.description = description !== undefined ? description : product.description;
  product.price = price !== undefined ? Number(price) : product.price;
  product.comparePrice = comparePrice !== undefined ? Number(comparePrice) : product.comparePrice;
  product.category = category || product.category;
  product.stock = stock !== undefined ? Number(stock) : product.stock;
  product.sku = sku !== undefined ? sku : product.sku;
  product.isActive = isActive !== undefined ? (isActive === "true" || isActive === true) : product.isActive;

  if (variants) {
    product.variants = typeof variants === "string" ? JSON.parse(variants) : variants;
  }

  if (req.files && req.files.length > 0) {
    try {
      const uploads = req.files.map((f) => uploadToCloudinary(f.buffer, "products"));
      product.images = await Promise.all(uploads);
    } catch (cloudErr) {
      console.error("Product image upload skipped:", cloudErr.message);
    }
  }

  const updated = await product.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Vendor (own) or SuperAdmin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (
    product.vendor.toString() !== req.user._id.toString() &&
    req.user.role !== "superadmin"
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this product");
  }

  await product.deleteOne();
  res.json({ success: true, message: "Product deleted successfully" });
});

module.exports = {
  createProduct, getMyProducts, getAllProducts,
  getProductById, updateProduct, deleteProduct,
};
