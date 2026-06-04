const express = require("express");
const router = express.Router();
const {
  createStore,
  getMyStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
  adminGetAllStores,
} = require("../controllers/storeController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { upload } = require("../config/cloudinary");

// IMPORTANT: Specific named routes must be declared BEFORE /:id
// otherwise Express will treat "vendor" and "admin" as an id parameter

// Super Admin — get all stores including inactive
router.get("/admin/all", protect, authorize("superadmin"), adminGetAllStores);

// Vendor — get own store
router.get("/vendor/my-store", protect, authorize("vendor"), getMyStore);

// Public — get all active stores
router.get("/", getAllStores);

// Vendor — create store
router.post("/", protect, authorize("vendor"), upload.single("logo"), createStore);

// Public — get single store by id
router.get("/:id", getStoreById);

// Vendor / SuperAdmin — update store
router.put("/:id", protect, authorize("vendor", "superadmin"), upload.single("logo"), updateStore);

// SuperAdmin — delete store
router.delete("/:id", protect, authorize("superadmin"), deleteStore);

module.exports = router;
