import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";

describe("Backend completion integration tests", () => {
  let adminToken: string;
  let categoryId: number;
  let productId: number;
  let cashRegisterId: number;

  beforeAll(async () => {
    await prisma.fiscalDocument.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.cashMovement.deleteMany();
    await prisma.cashRegister.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        email: "admin@mvsystem.com",
        passwordHash: await bcrypt.hash("securepassword", 4),
        role: "admin",
      },
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@mvsystem.com",
      password: "securepassword",
    });

    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should manage internal users and block their sessions", async () => {
    const created = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "employee@mvsystem.com", password: "securepassword", role: "caixa" });
    expect(created.status).toBe(201);
    const listed = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listed.body.some((user: any) => user.email === "employee@mvsystem.com")).toBe(true);
    const blocked = await request(app)
      .patch(`/api/users/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ active: false });
    expect(blocked.status).toBe(200);
    expect(blocked.body.active).toBe(false);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "employee@mvsystem.com", password: "securepassword" });
    expect(login.status).toBe(401);
  });

  it("should manage categories, products, cash and reports", async () => {
    const categoryRes = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Bebidas" });

    expect(categoryRes.status).toBe(201);
    expect(categoryRes.body).toHaveProperty("id");
    categoryId = categoryRes.body.id;

    const categoriesRes = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(categoriesRes.status).toBe(200);
    expect(Array.isArray(categoriesRes.body)).toBe(true);
    expect(categoriesRes.body.some((cat: any) => cat.id === categoryId)).toBe(true);

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Refrigerante",
        barcode: "12345",
        price: 4.5,
        stockQuantity: 10,
        categoryId,
      });

    expect(productRes.status).toBe(201);
    expect(productRes.body).toHaveProperty("id");
    productId = productRes.body.id;

    const productsRes = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(productsRes.status).toBe(200);
    expect(Array.isArray(productsRes.body)).toBe(true);
    expect(productsRes.body.some((prod: any) => prod.id === productId)).toBe(true);

    const barcodeRes = await request(app)
      .get("/api/products/barcode/12345")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(barcodeRes.status).toBe(200);
    expect(barcodeRes.body.barcode).toBe("12345");

    const openCashRes = await request(app)
      .post("/api/cash/open")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ initialAmount: 200 });

    expect(openCashRes.status).toBe(201);
    cashRegisterId = openCashRes.body.id;

    const registerListRes = await request(app)
      .get("/api/cash/registers")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(registerListRes.status).toBe(200);
    expect(Array.isArray(registerListRes.body)).toBe(true);
    expect(registerListRes.body.some((reg: any) => reg.id === cashRegisterId)).toBe(true);

    const movementRes = await request(app)
      .post("/api/cash/movement")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        cashRegisterId,
        type: "in",
        amount: 75,
        description: "Venda de mercadoria",
      });

    expect(movementRes.status).toBe(201);

    const movementsRes = await request(app)
      .get(`/api/cash/registers/${cashRegisterId}/movements`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(movementsRes.status).toBe(200);
    expect(Array.isArray(movementsRes.body)).toBe(true);
    expect(movementsRes.body.length).toBeGreaterThanOrEqual(1);

    const saleRes = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
        paymentMethod: "dinheiro",
        cashRegisterId,
        items: [
          {
            productId,
            quantity: 2,
          },
        ],
      });

    expect(saleRes.status).toBe(201);
    expect(saleRes.body).toHaveProperty("id");
    expect(saleRes.body.totalAmount).toBe("9");

    const retrySaleRes = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
        paymentMethod: "dinheiro",
        cashRegisterId,
        items: [{ productId, quantity: 2 }],
      });
    expect(retrySaleRes.status).toBe(201);
    expect(retrySaleRes.body.id).toBe(saleRes.body.id);

    const productAfterSale = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });
    expect(productAfterSale.stockQuantity.toString()).toBe("8");

    const salesRes = await request(app)
      .get("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(salesRes.status).toBe(200);
    expect(Array.isArray(salesRes.body)).toBe(true);
    expect(salesRes.body.length).toBeGreaterThanOrEqual(1);

    const dashboardRes = await request(app)
      .get("/api/reports/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body).toHaveProperty("totalSales");
    expect(dashboardRes.body.salesCount).toBeGreaterThanOrEqual(1);

    const auditRes = await request(app)
      .get("/api/audit/logs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.body)).toBe(true);
    expect(auditRes.body.length).toBeGreaterThanOrEqual(1);
  });
});
