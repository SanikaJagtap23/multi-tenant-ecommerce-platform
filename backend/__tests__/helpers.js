const request = require("supertest");
const app     = require("../app");
const User    = require("../models/User");
const generateToken = require("../utils/generateToken");

// Register a user through the API and return { _id, name, email, role, token }
const registerUser = async (overrides = {}) => {
  const payload = {
    name:     "Test User",
    email:    "testuser@example.com",
    password: "password123",
    role:     "customer",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(payload);
  return res.body.data;
};

// Create a superadmin directly in the DB (API blocks self-registration)
const createSuperAdmin = async () => {
  const admin = await User.create({
    name:     "Super Admin",
    email:    "superadmin@example.com",
    password: "admin123456",
    role:     "superadmin",
  });
  return {
    _id:   admin._id.toString(),
    name:  admin.name,
    email: admin.email,
    role:  admin.role,
    token: generateToken(admin._id),
  };
};

// Create a store for the given vendor token
const createStore = async (vendorToken, overrides = {}) => {
  const res = await request(app)
    .post("/api/stores")
    .set("Authorization", `Bearer ${vendorToken}`)
    .send({ name: "Test Store", category: "Electronics", ...overrides });
  return res.body.data;
};

// Create a product for the given vendor token (vendor must already have a store)
const createProduct = async (vendorToken, overrides = {}) => {
  const res = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${vendorToken}`)
    .send({ name: "Test Product", price: 299, category: "Electronics", stock: 50, ...overrides });
  return res.body.data;
};

module.exports = { registerUser, createSuperAdmin, createStore, createProduct };
