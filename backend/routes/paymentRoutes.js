const express = require("express");
const router  = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  failPayment,
  getMyPayments,
} = require("../controllers/paymentController");
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.post("/intent",                   protect, authorize("customer"), createPaymentIntent);
router.post("/confirm/:intentId",        protect, authorize("customer"), confirmPayment);
router.post("/fail/:intentId",           protect, authorize("customer"), failPayment);
router.get("/my",                        protect, authorize("customer"), getMyPayments);

module.exports = router;
