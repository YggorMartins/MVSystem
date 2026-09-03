import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getDayRange } from "../lib/date";

export async function daily() {
  const { start, end } = getDayRange();

  const sales = await prisma.sale.findMany({
    where: {
      cancelledAt: null,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    include: {
      items: true,
    },
  });

  const totalSales = sales.reduce((sum, sale) => sum.add(sale.totalAmount), new Prisma.Decimal(0));
  const totalItems = sales.reduce(
    (sum, sale) =>
      sum.add(
        sale.items.reduce((itemSum, item) => itemSum.add(item.quantity), new Prisma.Decimal(0)),
      ),
    new Prisma.Decimal(0),
  );
  const byPaymentMethod = sales.reduce<Record<string, { count: number; total: Prisma.Decimal }>>(
    (summary, sale) => {
      const current = summary[sale.paymentMethod] ?? { count: 0, total: new Prisma.Decimal(0) };
      summary[sale.paymentMethod] = {
        count: current.count + 1,
        total: current.total.add(sale.totalAmount),
      };
      return summary;
    },
    {},
  );
  const creditSales = sales.filter((sale) => sale.paymentMethod === "fiado");

  return {
    date: start.toISOString().split("T")[0],
    totalSales,
    totalItems,
    salesCount: sales.length,
    byPaymentMethod,
    creditTotal: creditSales.reduce(
      (sum, sale) => sum.add(sale.totalAmount),
      new Prisma.Decimal(0),
    ),
    creditOpen: creditSales
      .filter((sale) => !sale.creditPaidAt)
      .reduce(
        (sum, sale) => sum.add(sale.totalAmount.sub(sale.creditPaidAmount)),
        new Prisma.Decimal(0),
      ),
  };
}

export async function dashboard() {
  const { start, end } = getDayRange();
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const [sales, cashRegisters, openCredits, receivedCredits] = await Promise.all([
    prisma.sale.findMany({
      where: {
        cancelledAt: null,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        cashRegister: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cashRegister.findMany({
      include: { movements: true },
      orderBy: { openedAt: "desc" },
    }),
    prisma.sale.findMany({
      where: { paymentMethod: "fiado", creditPaidAt: null, cancelledAt: null },
      select: { totalAmount: true, creditPaidAmount: true },
    }),
    prisma.creditPayment.findMany({
      where: { createdAt: { gte: monthStart, lt: nextMonth } },
      select: { amount: true },
    }),
  ]);

  const totalSales = sales.reduce((sum, sale) => sum.add(sale.totalAmount), new Prisma.Decimal(0));
  const totalItems = sales.reduce(
    (sum, sale) =>
      sum.add(
        sale.items.reduce((itemSum, item) => itemSum.add(item.quantity), new Prisma.Decimal(0)),
      ),
    new Prisma.Decimal(0),
  );
  const byPaymentMethod = sales.reduce<Record<string, { count: number; total: Prisma.Decimal }>>(
    (summary, sale) => {
      const current = summary[sale.paymentMethod] ?? { count: 0, total: new Prisma.Decimal(0) };
      summary[sale.paymentMethod] = {
        count: current.count + 1,
        total: current.total.add(sale.totalAmount),
      };
      return summary;
    },
    {},
  );

  const cashRegisterSummaries = cashRegisters.map((register) => {
    const balance = register.movements.reduce((total, movement) => {
      return movement.type === "cash_in" ? total.add(movement.amount) : total.sub(movement.amount);
    }, register.initialAmount);

    return {
      id: register.id,
      status: register.status,
      openedAt: register.openedAt,
      closedAt: register.closedAt,
      initialAmount: register.initialAmount,
      balance,
    };
  });

  return {
    date: start.toISOString().split("T")[0],
    totalSales,
    totalItems,
    salesCount: sales.length,
    openCashRegisters: cashRegisters.filter((register) => register.status === "open").length,
    byPaymentMethod,
    outstandingCredit: openCredits.reduce(
      (sum, sale) => sum.add(sale.totalAmount.sub(sale.creditPaidAmount)),
      new Prisma.Decimal(0),
    ),
    creditReceivedThisMonth: receivedCredits.reduce(
      (sum, payment) => sum.add(payment.amount),
      new Prisma.Decimal(0),
    ),
    cashRegisters: cashRegisterSummaries,
    recentSales: sales.slice(0, 5).map((sale) => ({
      id: sale.id,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt,
      cashRegisterId: sale.cashRegisterId,
      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    })),
  };
}

type InventoryFilters = { categoryId?: number; stock?: "low" | "zero" };

export async function inventory(filters: InventoryFilters = {}) {
  const products = await prisma.product.findMany({
    where: {
      archivedAt: null,
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.stock === "zero" ? { stockQuantity: { equals: 0 } } : {}),
    },
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  const filtered =
    filters.stock === "low"
      ? products.filter(
          (product) =>
            product.stockQuantity.gt(0) && product.stockQuantity.lte(product.lowStockThreshold),
        )
      : products;
  const grouped = new Map<string, typeof filtered>();
  for (const product of filtered) {
    const name = product.category?.name ?? "Sem Categoria";
    grouped.set(name, [...(grouped.get(name) ?? []), product]);
  }
  const categories = [...grouped.entries()].map(([categoryName, items]) => {
    const productsDto = items.map((product) => ({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      stockQuantity: product.stockQuantity,
      unit: product.unit,
      costPrice: product.costPrice,
      salePrice: product.price,
      stockCostValue: product.stockQuantity.mul(product.costPrice),
      stockSaleValue: product.stockQuantity.mul(product.price),
      lowStockThreshold: product.lowStockThreshold,
    }));
    return {
      categoryId: items[0]?.categoryId ?? null,
      categoryName,
      metrics: {
        productsCount: items.length,
        stockVolume: items.reduce(
          (sum, item) => sum.add(item.stockQuantity),
          new Prisma.Decimal(0),
        ),
        totalCost: productsDto.reduce(
          (sum, item) => sum.add(item.stockCostValue),
          new Prisma.Decimal(0),
        ),
        totalSaleValue: productsDto.reduce(
          (sum, item) => sum.add(item.stockSaleValue),
          new Prisma.Decimal(0),
        ),
      },
      products: productsDto,
    };
  });
  const totalCost = categories.reduce(
    (sum, category) => sum.add(category.metrics.totalCost),
    new Prisma.Decimal(0),
  );
  const totalSaleValue = categories.reduce(
    (sum, category) => sum.add(category.metrics.totalSaleValue),
    new Prisma.Decimal(0),
  );
  return {
    generatedAt: new Date(),
    filters,
    categories,
    summary: {
      productsCount: filtered.length,
      totalCost,
      totalSaleValue,
      potentialGrossMargin: totalSaleValue.sub(totalCost),
      potentialGrossMarginPercent: totalSaleValue.gt(0)
        ? totalSaleValue.sub(totalCost).div(totalSaleValue).mul(100).toDecimalPlaces(2)
        : new Prisma.Decimal(0),
    },
  };
}
