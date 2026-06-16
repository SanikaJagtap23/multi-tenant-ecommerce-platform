const request = require("supertest");
const app = require("../app");
const { connect, disconnect, clearDatabase } = require("./dbSetup");
const { registerUser, createSuperAdmin, createStore } = require("./helpers");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDatabase);

// ─── Create Store ─────────────────────────────────────────────────────────────
describe("POST /api/stores", () => {
  it("vendor creates a store successfully", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });

    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "My Shop", category: "Electronics" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("My Shop");
  });

  it("vendor cannot create a second store", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token);

    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "Second Shop", category: "Fashion" });

    expect(res.status).toBe(400);
  });

  it("customer cannot create a store", async () => {
    const customer = await registerUser({ email: "c@example.com", role: "customer" });

    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ name: "My Shop", category: "Electronics" });

    expect(res.status).toBe(403);
  });

  it("fails with 401 without token", async () => {
    const res = await request(app)
      .post("/api/stores")
      .send({ name: "My Shop", category: "Electronics" });

    expect(res.status).toBe(401);
  });

  it("fails with 400 when name or category is missing", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });

    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "Only Name" });

    expect(res.status).toBe(400);
  });
});

// ─── Get All Stores (public) ──────────────────────────────────────────────────
describe("GET /api/stores", () => {
  it("returns a list of active stores without authentication", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token, { name: "Active Store" });

    const res = await request(app).get("/api/stores");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].name).toBe("Active Store");
  });

  it("returns empty list when no stores exist", async () => {
    const res = await request(app).get("/api/stores");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

// ─── Get Vendor's Own Store ───────────────────────────────────────────────────
describe("GET /api/stores/vendor/my-store", () => {
  it("returns null when vendor has no store yet", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });

    const res = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("returns vendor's store when it exists", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    await createStore(vendor.token, { name: "My Store" });

    const res = await request(app)
      .get("/api/stores/vendor/my-store")
      .set("Authorization", `Bearer ${vendor.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("My Store");
  });
});

// ─── Get Store by ID ─────────────────────────────────────────────────────────
describe("GET /api/stores/:id", () => {
  it("returns a store by ID", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    const store  = await createStore(vendor.token, { name: "Lookup Store" });

    const res = await request(app).get(`/api/stores/${store._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Lookup Store");
  });

  it("returns 404 for a non-existent store ID", async () => {
    const res = await request(app).get("/api/stores/64f0000000000000000000aa");
    expect(res.status).toBe(404);
  });
});

// ─── Update Store ─────────────────────────────────────────────────────────────
describe("PUT /api/stores/:id", () => {
  it("vendor updates their own store", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    const store  = await createStore(vendor.token, { name: "Old Name" });

    const res = await request(app)
      .put(`/api/stores/${store._id}`)
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
  });

  it("vendor cannot update another vendor's store", async () => {
    const vendor1 = await registerUser({ email: "v1@example.com", role: "vendor" });
    const vendor2 = await registerUser({ email: "v2@example.com", role: "vendor" });
    const store   = await createStore(vendor1.token, { name: "V1 Store" });

    const res = await request(app)
      .put(`/api/stores/${store._id}`)
      .set("Authorization", `Bearer ${vendor2.token}`)
      .send({ name: "Hijacked" });

    expect(res.status).toBe(403);
  });

  it("superadmin can update any store", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    const admin  = await createSuperAdmin();
    const store  = await createStore(vendor.token, { name: "Original" });

    const res = await request(app)
      .put(`/api/stores/${store._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "Admin Updated" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Admin Updated");
  });
});

// ─── Delete Store ─────────────────────────────────────────────────────────────
describe("DELETE /api/stores/:id", () => {
  it("superadmin can delete a store", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    const admin  = await createSuperAdmin();
    const store  = await createStore(vendor.token);

    const res = await request(app)
      .delete(`/api/stores/${store._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("vendor cannot delete their own store", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });
    const store  = await createStore(vendor.token);

    const res = await request(app)
      .delete(`/api/stores/${store._id}`)
      .set("Authorization", `Bearer ${vendor.token}`);

    expect(res.status).toBe(403);
  });
});
