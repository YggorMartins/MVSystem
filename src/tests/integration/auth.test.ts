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
      role: "caixa",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe("test@mvsystem.com");
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
