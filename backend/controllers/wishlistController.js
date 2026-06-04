const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "name price comparePrice images category stock store isActive"
  );
  res.json({ success: true, data: user.wishlist });
});

// POST /api/wishlist/:productId  — toggles add/remove
const toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const productId = req.params.productId;

  const index = user.wishlist.findIndex((id) => id.toString() === productId);

  if (index === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save();

  res.json({
    success: true,
    wishlisted: index === -1,
    wishlist: user.wishlist,
  });
});

module.exports = { getWishlist, toggleWishlist };
