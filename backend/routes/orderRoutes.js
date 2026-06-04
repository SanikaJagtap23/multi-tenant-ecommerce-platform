const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  updateOrderStatus,
  getAllOrders,
  getVendorAnalytics,
  getAdminAnalytics,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Admin routes (must come before /:id)
router.get("/admin/all", protect, authorize("superadmin"), getAllOrders);
router.get("/admin/analytics", protect, authorize("superadmin"), getAdminAnalytics);

// Vendor routes
router.get("/vendor/orders", protect, authorize("vendor"), getVendorOrders);
router.get("/vendor/analytics", protect, authorize("vendor"), getVendorAnalytics);

// Customer routes
router.get("/my", protect, authorize("customer"), getMyOrders);
router.post("/payment-intent", protect, authorize("customer"), createPaymentIntent);
router.post("/", protect, authorize("customer"), createOrder);

// Shared (customer/vendor/admin by ID)
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, authorize("vendor", "superadmin"), updateOrderStatus);

module.exports = router;
