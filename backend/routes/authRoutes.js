const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);
// Address routes (customer)
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addrId", protect, updateAddress);
router.delete("/addresses/:addrId", protect, deleteAddress);

module.exports = router;
