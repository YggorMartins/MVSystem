import { jest } from "@jest/globals";
import { prisma } from "../../lib/prisma";
import { daily } from "../../services/reportService";

describe("reportService.daily", () => {
  beforeAll(() => {
    jest.spyOn(prisma.sale, "findMany").mockResolvedValue([
      {
        id: 1,
        totalAmount: 100,
        paymentMethod: "cash",
        cashRegisterId: 1,
        createdAt: new Date("2026-01-01T10:00:00Z"),
        items: [
          {
            id: 1,
            saleId: 1,
            productId: 1,
            quantity: 2,
            unitPrice: 20,
            product: null,
          },
          {
            id: 2,
            saleId: 1,
            productId: 2,
            quantity: 3,
            unitPrice: 20,
            product: null,
          },
        ],
      },
      {
        id: 2,
        totalAmount: 50,
        paymentMethod: "card",
        cashRegisterId: 1,
        createdAt: new Date("2026-01-01T12:00:00Z"),
        items: [
          {
            id: 3,
            saleId: 2,
            productId: 1,
            quantity: 1,
            unitPrice: 50,
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

    expect(result).toMatchObject({
      totalSales: 150,
      totalItems: 6,
      salesCount: 2,
    });
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
