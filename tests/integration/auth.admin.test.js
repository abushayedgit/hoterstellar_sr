import request from "supertest";
import app from "../../src/app/app.js";
import { Admin } from "../../src/modules/auth/admin/admin.model.js";
import bcrypt from "bcryptjs";

describe("Admin Authentication", () => {
  beforeEach(async () => {
    await Admin.create({
      email: "admin@test.com",
      password: await bcrypt.hash("TestPass123!", 12),
      name: "Test Admin",
      role: "super_admin",
      isActive: true,
      mustChangePassword: false,
    });
  });

  test("POST /api/v1/auth/admin/login with valid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/admin/login")
      .send({ email: "admin@test.com", password: "TestPass123!" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.admin.email).toBe("admin@test.com");
  });

  test("POST /api/v1/auth/admin/login with invalid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/admin/login")
      .send({ email: "admin@test.com", password: "WrongPass123!" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/v1/auth/admin/login with non-existent admin", async () => {
    const response = await request(app)
      .post("/api/v1/auth/admin/login")
      .send({ email: "nonexistent@test.com", password: "TestPass123!" });

    expect(response.status).toBe(401);
  });
});
