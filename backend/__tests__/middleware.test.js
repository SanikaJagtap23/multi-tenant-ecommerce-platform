const request = require("supertest");
const app = require("../app");
const { connect, disconnect, clearDatabase } = require("./dbSetup");
const { registerUser, createSuperAdmin } = require("./helpers");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDatabase);

// We test middleware behaviour through real routes rather than in isolation.
// GET /api/auth/me  → requires protect (JWT check)
// GET /api/stores   → public (no middleware)
// POST /api/stores  → requires protect + authorize("vendor")

describe("protect middleware", () => {
  it("allows a request with a valid JWT", async () => {
    const user = await registerUser({ email: "u@example.com", role: "customer" });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
  });

  it("rejects a request with no Authorization header (401)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a request with a malformed token (401)", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.real.token");

    expect(res.status).toBe(401);
  });

  it("rejects a request with a token signed with the wrong secret (401)", async () => {
    const jwt = require("jsonwebtoken");
    const badToken = jwt.sign({ id: "64f0000000000000000000aa" }, "wrong_secret");

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${badToken}`);

    expect(res.status).toBe(401);
  });

  it("rejects a request for a deactivated user (401)", async () => {
    const User = require("../models/User");
    const user = await registerUser({ email: "u@example.com", role: "customer" });

    // Deactivate directly in DB
    await User.findOneAndUpdate({ email: "u@example.com" }, { isActive: false });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(401);
  });
});

describe("authorize (role) middleware", () => {
  it("allows access when the user has the correct role", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });

    // POST /api/stores requires vendor role
    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${vendor.token}`)
      .send({ name: "My Shop", category: "Electronics" });

    // 201 = allowed through the role check (store created)
    expect(res.status).toBe(201);
  });

  it("returns 403 when a customer tries to access a vendor-only route", async () => {
    const customer = await registerUser({ email: "c@example.com", role: "customer" });

    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ name: "My Shop", category: "Electronics" });

    expect(res.status).toBe(403);
  });

  it("returns 403 when a vendor tries to access an admin-only route", async () => {
    const vendor = await registerUser({ email: "v@example.com", role: "vendor" });

    // GET /api/admin/stats requires superadmin role
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${vendor.token}`);

    expect(res.status).toBe(403);
  });

  it("superadmin can access admin-only routes", async () => {
    const admin = await createSuperAdmin();

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
  });
});
