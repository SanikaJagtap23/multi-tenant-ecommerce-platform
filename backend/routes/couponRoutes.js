const express = require("express");
const router  = express.Router();
const {
  getVendorCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
} = require("../controllers/couponController");
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Customer: validate a coupon code
router.get("/validate", protect, authorize("customer"), validateCoupon);

// Vendor: manage own coupons
router.get("/mine",         protect, authorize("vendor"), getVendorCoupons);
router.post("/",            protect, authorize("vendor"), createCoupon);
router.delete("/:id",       protect, authorize("vendor"), deleteCoupon);
router.put("/:id/toggle",   protect, authorize("vendor"), toggleCoupon);

module.exports = router;
