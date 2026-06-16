const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");
const { connect, disconnect, clearDatabase } = require("./dbSetup");
const { registerUser, createSuperAdmin, createStore, createProduct } = require("./helpers");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDatabase);

const shippingAddress = {
  fullName:   "Test Customer",
  street:     "123 Main St",
  city:       "Mumbai",
  state:      "Maharashtra",
  postalCode: "400001",
  country:    "India",
};

// ─── Create Order (COD) ───────────────────────────────────────────────────────
describe("POST /api/orders", () => {
  let vendor, customer, product;

  beforeEach(async () => {
    vendor   = await registerUser({ email: "v@example.com", role: "vendor" });
    customer = await registerUser({ email: "c@example.com", role: "customer" });
    await createStore(vendor.token);
    product  = await createProduct(vendor.token, { name: "Widget", price: 200, stock: 10 });
  });

  it("customer places a COD order successfully", async () => {
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        storeId:         store.body.data._id,
        items:           [{ productId: product._id, quantity: 2 }],
        shippingAddress,
        paymentMethod:   "cod",
      });

    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe("cod");
    expect(res.body.status).toBe("pending");
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(2);
  });

  it("order creation reduces product stock", async () => {
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        storeId:         store.body.data._id,
        items:           [{ productId: product._id, quantity: 3 }],
        shippingAddress,
        paymentMethod:   "cod",
      });

    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(7); // 10 - 3
  });

  it("calculates subtotal, tax and shipping correctly", async () => {
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        storeId:         store.body.data._id,
        items:           [{ productId: product._id, quantity: 1 }],
        shippingAddress,
        paymentMethod:   "cod",
      });

    // price=200, qty=1 → subtotal=200, tax=20 (10%), shipping=49 (<500 threshold)
    expect(res.body.subtotal).toBe(200);
    expect(res.body.tax).toBe(20);
    expect(res.body.shippingCost).toBe(49);
    expect(res.body.totalAmount).toBe(269);
  });

  it("applies free shipping for orders over ₹500", async () => {
    const expProduct = await createProduct(vendor.token, { name: "Expensive", price: 600, stock: 5 });
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        storeId:         store.body.data._id,
        items:           [{ productId: expProduct._id, quantity: 1 }],
        shippingAddress,
        paymentMethod:   "cod",
      });

    expect(res.body.shippingCost).toBe(0);
  });

  it("fails with 400 for insufficient stock", async () => {
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        storeId:         store.body.data._id,
        items:           [{ productId: product._id, quantity: 999 }],
        shippingAddress,
        paymentMethod:   "cod",
      });

    expect(res.status).toBe(400);
  });

  it("fails with 400 when paymentMethod is not cod", async () => {
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        storeId:         store.body.data._id,
        items:           [{ productId: product._id, quantity: 1 }],
        shippingAddress,
        paymentMethod:   "stripe",
      });

    expect(res.status).toBe(400);
  });

  it("fails with 400 when no items are given", async () => {
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        storeId:         store.body.data._id,
        items:           [],
        shippingAddress,
        paymentMethod:   "cod",
      });

    expect(res.status).toBe(400);
  });

  it("vendor and unauthenticated users cannot place orders", async () => {
    const store = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    const resVendor = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ storeId: store.body.data._id, items: [{ productId: product._id, quantity: 1 }], shippingAddress, paymentMethod: "cod" });

    const resGuest = await request(app)
      .post("/api/orders")
      .send({ storeId: store.body.data._id, items: [{ productId: product._id, quantity: 1 }], shippingAddress, paymentMethod: "cod" });

    expect(resVendor.status).toBe(403);
    expect(resGuest.status).toBe(401);
  });
});

// ─── Get My Orders ────────────────────────────────────────────────────────────
describe("GET /api/orders/my", () => {
  it("customer sees their own orders", async () => {
    const vendor   = await registerUser({ email: "v@example.com", role: "vendor" });
    const customer = await registerUser({ email: "c@example.com", role: "customer" });
    await createStore(vendor.token);
    const product = await createProduct(vendor.token, { stock: 10, price: 200 });
    const store   = await request(app).get("/api/stores/vendor/my-store").set("Authorization", `Bearer ${vendor.token}`);

    await request(app).post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ storeId: store.body.data._id, items: [{ productId: product._id, quantity: 1 }], shippingAddress, paymentMethod: "cod" });

    const res = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${customer.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("vendor cannot access this customer-only route", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    const res = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${vendor.token}`);

    expect(res.status).toBe(403);
  });
});

// ─── Update Order Status ──────────────────────────────────────────────────────
describe("PUT /api/orders/:id/status", () => {
  let vendor, customer, order, productId;

  beforeEach(async () => {
    vendor   = await registerUser({ email: "v@example.com", role: "vendor" });
    customer = await registerUser({ email: "c@example.com", role: "customer" });
    await createStore(vendor.token);
    const product = await createProduct(vendor.token, { stock: 10, price: 200 });
    productId = product._id;
    const store = await request(app).get("/api/stores/vendor/my-store").set("Authorization", `Bearer ${vendor.token}`);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ storeId: store.body.data._id, items: [{ productId, quantity: 3 }], shippingAddress, paymentMethod: "cod" });
    order = res.body;
  });

  it("vendor updates order status to confirmed", async () => {
    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
  });

  it("cancelling an order restores product stock", async () => {
    const before = await Product.findById(productId);
    expect(before.stock).toBe(7); // 10 - 3

    await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ status: "cancelled" });

    const after = await Product.findById(productId);
    expect(after.stock).toBe(10); // restored
  });

  it("marking COD order as delivered sets paymentStatus to paid", async () => {
    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ status: "delivered" });

    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe("paid");
  });

  it("customer cannot update order status", async () => {
    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(403);
  });
});

// ─── Get Order by ID ──────────────────────────────────────────────────────────
describe("GET /api/orders/:id", () => {
  it("customer can view their own order", async () => {
    const vendor   = await registerUser({ email: "v@example.com", role: "vendor" });
    const customer = await registerUser({ email: "c@example.com", role: "customer" });
    await createStore(vendor.token);
    const product = await createProduct(vendor.token, { stock: 10, price: 200 });
    const store = await request(app).get("/api/stores/vendor/my-store").set("Authorization", `Bearer ${vendor.token}`);

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ storeId: store.body.data._id, items: [{ productId: product._id, quantity: 1 }], shippingAddress, paymentMethod: "cod" });

    const res = await request(app)
      .get(`/api/orders/${created.body._id}`)
      .set("Authorization", `Bearer ${customer.token}`);

    expect(res.status).toBe(200);
  });

  it("returns 403 when a different customer tries to view the order", async () => {
    const vendor    = await registerUser({ email: "v@example.com", role: "vendor" });
    const customer1 = await registerUser({ email: "c1@example.com", role: "customer" });
    const customer2 = await registerUser({ email: "c2@example.com", role: "customer" });
    await createStore(vendor.token);
    const product = await createProduct(vendor.token, { stock: 10, price: 200 });
    const store = await request(app).get("/api/stores/vendor/my-store").set("Authorization", `Bearer ${vendor.token}`);

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer1.token}`)
      .send({ storeId: store.body.data._id, items: [{ productId: product._id, quantity: 1 }], shippingAddress, paymentMethod: "cod" });

    const res = await request(app)
      .get(`/api/orders/${created.body._id}`)
      .set("Authorization", `Bearer ${customer2.token}`);

    expect(res.status).toBe(403);
  });
});
