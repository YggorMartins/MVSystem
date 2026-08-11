import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../lib/prisma";

describe("Cash flow integration tests", () => {
  let token: string;

  beforeAll(async () => {
    await prisma.cashMovement.deleteMany();
    await prisma.cashRegister.deleteMany();
    await prisma.user.deleteMany();

    await request(app).post("/api/auth/register").send({
      email: "cashuser@mvsystem.com",
      password: "securepassword",
      role: "caixa",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "cashuser@mvsystem.com",
      password: "securepassword",
    });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should open a cash register successfully", async () => {
    const res = await request(app)
      .post("/api/cash/open")
      .set("Authorization", `Bearer ${token}`)
      .send({ initialAmount: 100 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe("open");
  });

  it("should reject cash open when already open", async () => {
    const res = await request(app)
      .post("/api/cash/open")
      .set("Authorization", `Bearer ${token}`)
      .send({ initialAmount: 50 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should reject movement without authentication", async () => {
    const res = await request(app).post("/api/cash/movement").send({
      cashRegisterId: 1,
      type: "in",
      amount: 20,
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("should reject movement with invalid role", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      email: "user2@mvsystem.com",
      password: "securepassword",
      role: "estoque",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "user2@mvsystem.com",
      password: "securepassword",
    });

    const unauthorizedToken = loginRes.body.token;

    const res = await request(app)
      .post("/api/cash/movement")
      .set("Authorization", `Bearer ${unauthorizedToken}`)
      .send({
        cashRegisterId: 1,
        type: "in",
        amount: 20,
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("should create cash movements and prevent overdraft", async () => {
    const inRes = await request(app)
      .post("/api/cash/movement")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cashRegisterId: 1,
        type: "in",
        amount: 50,
      });

    expect(inRes.status).toBe(201);
    expect(inRes.body).toHaveProperty("id");

    const outRes = await request(app)
      .post("/api/cash/movement")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cashRegisterId: 1,
        type: "out",
        amount: 200,
      });

    expect(outRes.status).toBe(400);
    expect(outRes.body).toHaveProperty("error");
  });

  it("should close the cash register", async () => {
    const res = await request(app)
      .post("/api/cash/close/1")
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("closed");
  });

  it("should reject movement after cash register is closed", async () => {
    const res = await request(app)
      .post("/api/cash/movement")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cashRegisterId: 1,
        type: "in",
        amount: 20,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
