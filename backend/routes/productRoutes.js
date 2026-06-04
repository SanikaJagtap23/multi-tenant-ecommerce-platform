const express = require("express");
const router = express.Router();
const {
  createProduct,
  getMyProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { upload } = require("../config/cloudinary");

// IMPORTANT: Specific named routes must be declared BEFORE /:id

// Vendor — get own products
router.get("/vendor/my-products", protect, authorize("vendor"), getMyProducts);

// Public — get all active products (supports ?search=&category=&storeId=)
router.get("/", getAllProducts);

// Vendor — create product (up to 5 images)
router.post("/", protect, authorize("vendor"), upload.array("images", 5), createProduct);

// Public — get single product
router.get("/:id", getProductById);

// Vendor / SuperAdmin — update product
router.put("/:id", protect, authorize("vendor", "superadmin"), upload.array("images", 5), updateProduct);

// Vendor / SuperAdmin — delete product
router.delete("/:id", protect, authorize("vendor", "superadmin"), deleteProduct);

module.exports = router;
