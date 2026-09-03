import { jest } from "@jest/globals";
import { prisma } from "../../lib/prisma";
import { daily } from "../../services/reportService";
import { Prisma } from "@prisma/client";

describe("reportService.daily", () => {
  beforeAll(() => {
    jest.spyOn(prisma.sale, "findMany").mockResolvedValue([
      {
        id: 1,
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174001",
        totalAmount: new Prisma.Decimal(100),
        paymentMethod: "dinheiro",
        cashRegisterId: 1,
        createdAt: new Date("2026-01-01T10:00:00Z"),
        items: [
          {
            id: 1,
            saleId: 1,
            productId: 1,
            quantity: new Prisma.Decimal(2),
            unitPrice: new Prisma.Decimal(20),
            product: null,
          },
          {
            id: 2,
            saleId: 1,
            productId: 2,
            quantity: new Prisma.Decimal(3),
            unitPrice: new Prisma.Decimal(20),
            product: null,
          },
        ],
      },
      {
        id: 2,
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
        totalAmount: new Prisma.Decimal(50),
        paymentMethod: "cartao_credito",
        cashRegisterId: 1,
        createdAt: new Date("2026-01-01T12:00:00Z"),
        items: [
          {
            id: 3,
            saleId: 2,
            productId: 1,
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(50),
            product: null,
          },
        ],
      },
    ] as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should return a daily report with totals and sales count", async () => {
    const result = await daily();

    expect(result.totalSales.toString()).toBe("150");
    expect(result.totalItems.toString()).toBe("6");
    expect(result.salesCount).toBe(2);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
