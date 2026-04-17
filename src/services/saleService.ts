import { prisma } from "../lib/prisma";

type SaleItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

type CreateSaleInput = {
  totalAmount: number;
  paymentMethod: string;
  cashRegisterId: number;
  items: SaleItemInput[];
};

export async function create(data: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        cashRegisterId: data.cashRegisterId,
      },
    });

    for (const item of data.items) {
      await tx.saleItem.create({
        data: {
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    return tx.sale.findUnique({
      where: { id: newSale.id },
      include: { items: true },
    });
  });
}