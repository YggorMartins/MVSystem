import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../lib/prisma";

describe("Auth Integration Tests", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should register a new system user correctly", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@mvsystem.com",
      password: "securepassword",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe("test@mvsystem.com");
    expect(res.body.role).toBe("caixa");
  });

  it("should reject role escalation during public registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "attacker@mvsystem.com",
      password: "securepassword",
      role: "admin",
    });
    expect(res.status).toBe(400);
  });

  it("should fail authentication with wrong credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@mvsystem.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});
