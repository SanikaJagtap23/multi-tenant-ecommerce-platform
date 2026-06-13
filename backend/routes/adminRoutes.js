const express = require("express");
const router  = express.Router();
const {
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
} = require("../controllers/adminController");
const { protect }    = require("../middleware/authMiddleware");
const { authorize }  = require("../middleware/roleMiddleware");

// All routes require superadmin
router.use(protect, authorize("superadmin"));

// Stats
router.get("/stats", getAdminStats);

// Users (customers + vendors)
router.get("/users",              getAllUsers);
router.get("/users/:id",          getUserById);
router.put("/users/:id/status",   updateUserStatus);
router.put("/users/:id/role",     updateUserRole);
router.delete("/users/:id",       deleteUser);

// Stores
router.get("/stores/names",       adminGetStoreNames);   // lightweight — must be before /:id
router.get("/stores",             adminGetAllStores);
router.put("/stores/:id/status",  toggleStoreStatus);
router.delete("/stores/:id",      adminDeleteStore);

// Products
router.get("/products",           adminGetAllProducts);

// Orders
router.get("/orders",             adminGetAllOrders);

module.exports = router;
