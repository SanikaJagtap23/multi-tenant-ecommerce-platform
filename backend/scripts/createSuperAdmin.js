require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const ADMIN_NAME     = "Super Admin";
const ADMIN_EMAIL    = "admin@tradezy.com";
const ADMIN_PASSWORD = "Admin@1234";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const User = require("../models/User");

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    // Reset password correctly via model so pre-save hook hashes it once
    existing.role     = "superadmin";
    existing.isActive = true;
    existing.password = ADMIN_PASSWORD;
    await existing.save();
    console.log("Superadmin password reset successfully!");
    console.log("  Email   :", ADMIN_EMAIL);
    console.log("  Password:", ADMIN_PASSWORD);
    process.exit(0);
  }

  // Pass plain password — the model's pre-save hook will hash it once
  await User.create({
    name:     ADMIN_NAME,
    email:    ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role:     "superadmin",
    isActive: true,
  });

  console.log("Superadmin created successfully!");
  console.log("  Email   :", ADMIN_EMAIL);
  console.log("  Password:", ADMIN_PASSWORD);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
