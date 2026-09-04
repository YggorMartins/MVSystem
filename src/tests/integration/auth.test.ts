import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../lib/prisma";

describe("Auth Integration Tests", () => {
  beforeAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.create({
      data: {
        email: "test@mvsystem.com",
        passwordHash: await bcrypt.hash("securepassword", 4),
        role: "caixa",
      },
    });
  });
  afterAll(async () => prisma.$disconnect());

  it("does not expose public registration", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/register")
          .send({ email: "new@mvsystem.com", password: "securepassword" })
      ).status,
    ).toBe(404);
  });
  it("authenticates an active user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@mvsystem.com", password: "securepassword" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
  it("rejects wrong credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@mvsystem.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });
  it("rejects blocked users", async () => {
    await prisma.user.update({ where: { email: "test@mvsystem.com" }, data: { active: false } });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@mvsystem.com", password: "securepassword" });
    expect(res.status).toBe(401);
  });
});
