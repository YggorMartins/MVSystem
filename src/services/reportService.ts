import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getDayRange } from "../lib/date";

export async function daily() {
  const { start, end } = getDayRange();

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    include: {
      items: true,
    },
  });

  const totalSales = sales.reduce(
    (sum, sale) => sum.add(sale.totalAmount),
    new Prisma.Decimal(0),
  );
  const totalItems = sales.reduce(
    (sum, sale) =>
      sum.add(sale.items.reduce(
        (itemSum, item) => itemSum.add(item.quantity),
        new Prisma.Decimal(0),
      )),
    new Prisma.Decimal(0),
  );

  return {
    date: start.toISOString().split("T")[0],
    totalSales,
    totalItems,
    salesCount: sales.length,
  };
}

export async function dashboard() {
  const { start, end } = getDayRange();

  const [sales, cashRegisters] = await Promise.all([
    prisma.sale.findMany({
      where: {
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
  ]);

  const totalSales = sales.reduce(
    (sum, sale) => sum.add(sale.totalAmount),
    new Prisma.Decimal(0),
  );
  const totalItems = sales.reduce(
    (sum, sale) =>
      sum.add(sale.items.reduce(
        (itemSum, item) => itemSum.add(item.quantity),
        new Prisma.Decimal(0),
      )),
    new Prisma.Decimal(0),
  );

  const cashRegisterSummaries = cashRegisters.map((register) => {
    const balance = register.movements.reduce((total, movement) => {
      return movement.type === "cash_in"
        ? total.add(movement.amount)
        : total.sub(movement.amount);
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
    openCashRegisters: cashRegisters.filter(
      (register) => register.status === "open",
    ).length,
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
