/**
 * One-time migration: mark all delivered COD orders as paid.
 * Run once: node backend/scripts/fixCodPaymentStatus.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Order = require("../models/Order");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const result = await Order.updateMany(
    { status: "delivered", paymentMethod: "cod", paymentStatus: "unpaid" },
    { $set: { paymentStatus: "paid" } }
  );

  console.log(`Updated ${result.modifiedCount} order(s) — COD delivered → paid`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
