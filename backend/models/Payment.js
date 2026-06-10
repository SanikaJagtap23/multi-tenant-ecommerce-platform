const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "upi", "netbanking", "wallet"],
      required: true,
    },
    gateway: { type: String, enum: ["stripe", "cod", "dummy"], default: "dummy" },
    stripePaymentIntentId: { type: String, default: "" },
    amount:   { type: Number, required: true },
    currency: { type: String, default: "inr" },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "refunded"],
      default: "pending",
    },
    failureReason: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ orders: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
