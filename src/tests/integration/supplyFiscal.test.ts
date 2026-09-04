import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../lib/prisma";

describe("Purchases, scanner data and fiscal simulation", () => {
  let token = "";
  let supplierId = 0;
  let productId = 0;
  let cashId = 0;
  let purchaseId = 0;
  let saleId = 0;
  beforeAll(async () => {
    await prisma.fiscalDocument.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.cashMovement.deleteMany();
    await prisma.cashRegister.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.create({
      data: {
        email: "fiscal-admin@mvsystem.com",
        passwordHash: await bcrypt.hash("securepassword", 4),
        role: "admin",
      },
    });
    token = (
      await request(app)
        .post("/api/auth/login")
        .send({ email: "fiscal-admin@mvsystem.com", password: "securepassword" })
    ).body.token;
    productId = (
      await request(app).post("/api/products").set("Authorization", `Bearer ${token}`).send({
        name: "Produto com scanner",
        barcode: "7891234567890",
        price: 10,
        costPrice: 0,
        stockQuantity: 0,
        unit: "UN",
        lowStockThreshold: 1,
      })
    ).body.id;
  });
  afterAll(async () => prisma.$disconnect());
  it("creates supplier and receives an idempotent purchase", async () => {
    const supplier = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Fornecedor Teste", document: "12345678901" });
    expect(supplier.status).toBe(201);
    supplierId = supplier.body.id;
    const payload = {
      idempotencyKey: "223e4567-e89b-42d3-a456-426614174000",
      supplierId,
      invoiceNumber: "NF-100",
      items: [{ productId, quantity: 5, unitCost: 6.25 }],
    };
    const first = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    expect(first.status).toBe(201);
    expect(first.body.totalAmount).toBe("31.25");
    purchaseId = first.body.id;
    const retry = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    expect(retry.body.id).toBe(purchaseId);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQuantity.toString()).toBe("5");
    expect(product.costPrice.toString()).toBe("6.25");
  });
  it("sells scanned product and produces an idempotent, clearly simulated NFC-e", async () => {
    cashId = (
      await request(app)
        .post("/api/cash/open")
        .set("Authorization", `Bearer ${token}`)
        .send({ initialAmount: 0 })
    ).body.id;
    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        idempotencyKey: "323e4567-e89b-42d3-a456-426614174000",
        paymentMethod: "dinheiro",
        cashRegisterId: cashId,
        items: [{ productId, quantity: 2 }],
      });
    expect(sale.status).toBe(201);
    saleId = sale.body.id;
    const fiscal = await request(app)
      .post(`/api/sales/${saleId}/nfce/simulate`)
      .set("Authorization", `Bearer ${token}`);
    expect(fiscal.status).toBe(201);
    expect(fiscal.body.status).toBe("authorized_simulation");
    expect(fiscal.body.accessKey).toMatch(/^\d{44}$/);
    const retry = await request(app)
      .post(`/api/sales/${saleId}/nfce/simulate`)
      .set("Authorization", `Bearer ${token}`);
    expect(retry.body.id).toBe(fiscal.body.id);
  });
  it("prevents purchase reversal after received stock was consumed", async () => {
    const result = await request(app)
      .delete(`/api/purchases/${purchaseId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(409);
    expect(
      (
        await prisma.product.findUniqueOrThrow({ where: { id: productId } })
      ).stockQuantity.toString(),
    ).toBe("3");
  });
});
