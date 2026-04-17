import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const create = async (data: {
  totalAmount: number;
  paymentMethod: string;
  cashRegisterId: number;
  items: { productId: number; quantity: number; unitPrice: number }[];
}) => {
  const sale = await prisma.$transaction(async (tx) => {
    // create sale
    const newSale = await tx.sale.create({
      data: {
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        cashRegisterId: data.cashRegisterId,
      },
    });
    // create sale items and update stock
    for (const item of data.items) {
      await tx.saleItem.create({
        data: {
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });
      // decrement stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }
    return tx.sale.findUnique({
      where: { id: newSale.id },
      include: { items: true },
    });
  });
  return sale;
};