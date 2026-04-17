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

  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalItems = sales.reduce(
    (sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return {
    date: start.toISOString().split("T")[0],
    totalSales,
    totalItems,
    salesCount: sales.length,
  };
}