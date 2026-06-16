const request = require("supertest");
const app = require("../app");
const { connect, disconnect, clearDatabase } = require("./dbSetup");
const { registerUser, createStore, createProduct } = require("./helpers");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDatabase);

// ─── Create Product ───────────────────────────────────────────────────────────
describe("POST /api/products", () => {
  it("vendor creates a product after having a store", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "Shoes", price: 499, category: "Fashion", stock: 20 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Shoes");
    expect(res.body.data.price).toBe(499);
    expect(res.body.data.stock).toBe(20);
  });

  it("vendor without a store cannot create a product", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "Shoes", price: 499, category: "Fashion", stock: 20 });

    expect(res.status).toBe(404);
  });

  it("customer cannot create a product", async () => {
    const customer = await registerUser({ email: "c@example.com", role: "customer" });

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ name: "Shoes", price: 499, category: "Fashion" });

    expect(res.status).toBe(403);
  });

  it("fails with 400 when name, price, or category is missing", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "No Price" });

    expect(res.status).toBe(400);
  });

  it("fails with 401 without token", async () => {
    const res = await request(app).post("/api/products").send({ name: "X", price: 100, category: "Y" });
    expect(res.status).toBe(401);
  });
});

// ─── Get All Products (public) ────────────────────────────────────────────────
describe("GET /api/products", () => {
  let vendor;

  beforeEach(async () => {
    vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);
  });

  it("returns all active products without authentication", async () => {
    await createProduct(vendor.token, { name: "Product A", category: "Electronics" });
    await createProduct(vendor.token, { name: "Product B", category: "Fashion" });

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
  });

  it("filters products by category", async () => {
    await createProduct(vendor.token, { name: "Phone", category: "Electronics" });
    await createProduct(vendor.token, { name: "Shirt", category: "Fashion" });

    const res = await request(app).get("/api/products?category=Electronics");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].name).toBe("Phone");
  });

  it("filters products by search term", async () => {
    await createProduct(vendor.token, { name: "Wireless Headphones" });
    await createProduct(vendor.token, { name: "USB Cable" });

    const res = await request(app).get("/api/products?search=headphone");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].name).toBe("Wireless Headphones");
  });

  it("filters products by price range", async () => {
    await createProduct(vendor.token, { name: "Budget", price: 100 });
    await createProduct(vendor.token, { name: "Premium", price: 5000 });

    const res = await request(app).get("/api/products?minPrice=50&maxPrice=500");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].name).toBe("Budget");
  });

  it("returns empty list when no products exist", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

// ─── Get Product by ID ────────────────────────────────────────────────────────
describe("GET /api/products/:id", () => {
  it("returns a product by ID", async () => {
    const vendor  = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);
    const product = await createProduct(vendor.token, { name: "Target Product" });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Target Product");
  });

  it("returns 404 for a non-existent product ID", async () => {
    const res = await request(app).get("/api/products/64f0000000000000000000ab");
    expect(res.status).toBe(404);
  });
});

// ─── Update Product ───────────────────────────────────────────────────────────
describe("PUT /api/products/:id", () => {
  it("vendor updates their own product", async () => {
    const vendor  = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);
    const product = await createProduct(vendor.token, { name: "Old Name", price: 100 });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "New Name", price: 200 });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
    expect(res.body.data.price).toBe(200);
  });

  it("vendor cannot update another vendor's product", async () => {
    const vendor1 = await registerUser({ email: "v1@example.com", role: "vendor" });
    const vendor2 = await registerUser({ email: "v2@example.com", role: "vendor" });
    await createStore(vendor1.token);
    await createStore(vendor2.token, { name: "V2 Store" });
    const product = await createProduct(vendor1.token, { name: "V1 Product" });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${vendor2.token}`)
      .send({ name: "Hijacked" });

    expect(res.status).toBe(403);
  });

  it("returns 404 for a non-existent product ID", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);

    const res = await request(app)
      .put("/api/products/64f0000000000000000000ab")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "Ghost" });

    expect(res.status).toBe(404);
  });
});

// ─── Delete Product ───────────────────────────────────────────────────────────
describe("DELETE /api/products/:id", () => {
  it("vendor deletes their own product", async () => {
    const vendor  = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);
    const product = await createProduct(vendor.token);

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${vendor.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("vendor cannot delete another vendor's product", async () => {
    const vendor1 = await registerUser({ email: "v1@example.com", role: "vendor" });
    const vendor2 = await registerUser({ email: "v2@example.com", role: "vendor" });
    await createStore(vendor1.token);
    await createStore(vendor2.token, { name: "V2 Store" });
    const product = await createProduct(vendor1.token);

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${vendor2.token}`);

    expect(res.status).toBe(403);
  });
});
