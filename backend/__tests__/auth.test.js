const request = require("supertest");
const app = require("../app");
const { connect, disconnect, clearDatabase } = require("./dbSetup");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDatabase);

// ─── Register ────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("registers a customer successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "customer",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe("customer");
    expect(res.body.data.email).toBe("john@example.com");
  });

  it("registers a vendor successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Vendor User",
      email: "vendor@example.com",
      password: "password123",
      role: "vendor",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("vendor");
  });

  it("defaults to customer role when no role is given", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "No Role",
      email: "norole@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("customer");
  });

  it("silently downgrades superadmin role to customer", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Attacker",
      email: "attacker@example.com",
      password: "password123",
      role: "superadmin",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("customer");
  });

  it("fails with 400 when email already exists", async () => {
    await request(app).post("/api/auth/register").send({
      name: "John", email: "john@example.com", password: "pass123", role: "customer",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "John2", email: "john@example.com", password: "pass123", role: "customer",
    });
    expect(res.status).toBe(400);
  });

  it("fails with 400 when name is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com", password: "pass123",
    });
    expect(res.status).toBe(400);
  });

  it("fails with 400 when password is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test", email: "test@example.com",
    });
    expect(res.status).toBe(400);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "John", email: "john@example.com", password: "password123", role: "customer",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "john@example.com", password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.email).toBe("john@example.com");
  });

  it("fails with 401 when password is wrong", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "john@example.com", password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("fails with 401 when email does not exist", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com", password: "password123",
    });
    expect(res.status).toBe(401);
  });

  it("fails with 400 when email is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("fails with 400 when password is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "john@example.com",
    });
    expect(res.status).toBe(400);
  });
});

// ─── Get Me ──────────────────────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  it("returns the profile of the logged-in user", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "Jane", email: "jane@example.com", password: "password123", role: "customer",
    });
    const token = reg.body.data.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("jane@example.com");
    expect(res.body.data.name).toBe("Jane");
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this.is.invalid");
    expect(res.status).toBe(401);
  });
});

// ─── Update Profile ──────────────────────────────────────────────────────────
describe("PUT /api/auth/profile", () => {
  it("updates the user name", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "Old Name", email: "user@example.com", password: "password123", role: "customer",
    });
    const token = reg.body.data.token;

    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
  });

  it("returns 401 without token", async () => {
    const res = await request(app).put("/api/auth/profile").send({ name: "X" });
    expect(res.status).toBe(401);
  });
});

// ─── Change Password ─────────────────────────────────────────────────────────
describe("PUT /api/auth/password", () => {
  let token;

  beforeEach(async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "User", email: "user@example.com", password: "oldpassword", role: "customer",
    });
    token = reg.body.data.token;
  });

  it("changes password successfully", async () => {
    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "oldpassword", newPassword: "newpassword123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify old password no longer works
    const loginOld = await request(app).post("/api/auth/login").send({
      email: "user@example.com", password: "oldpassword",
    });
    expect(loginOld.status).toBe(401);

    // Verify new password works
    const loginNew = await request(app).post("/api/auth/login").send({
      email: "user@example.com", password: "newpassword123",
    });
    expect(loginNew.status).toBe(200);
  });

  it("fails with 400 when current password is wrong", async () => {
    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newpassword123" });

    expect(res.status).toBe(400);
  });

  it("fails with 400 when new password is too short", async () => {
    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "oldpassword", newPassword: "abc" });

    expect(res.status).toBe(400);
  });
});

// ─── Addresses ───────────────────────────────────────────────────────────────
describe("Address CRUD /api/auth/addresses", () => {
  let token;
  const validAddress = {
    fullName: "John Doe",
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
  };

  beforeEach(async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "User", email: "user@example.com", password: "password123", role: "customer",
    });
    token = reg.body.data.token;
  });

  it("adds an address and returns the list", async () => {
    const res = await request(app)
      .post("/api/auth/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send(validAddress);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].city).toBe("Mumbai");
    expect(res.body.data[0].isDefault).toBe(true); // first address is default
  });

  it("gets the address list", async () => {
    await request(app).post("/api/auth/addresses")
      .set("Authorization", `Bearer ${token}`).send(validAddress);

    const res = await request(app)
      .get("/api/auth/addresses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("fails to add address when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Only Name" });

    expect(res.status).toBe(400);
  });

  it("deletes an address", async () => {
    const add = await request(app).post("/api/auth/addresses")
      .set("Authorization", `Bearer ${token}`).send(validAddress);
    const addrId = add.body.data[0]._id;

    const res = await request(app)
      .delete(`/api/auth/addresses/${addrId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
