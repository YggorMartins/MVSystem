import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const daily = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow },
    },
    include: { items: true },
  });

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

  return { date: today.toISOString().split('T')[0], totalSales, totalItems, salesCount: sales.length };
};