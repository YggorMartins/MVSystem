import { prisma } from "../lib/prisma";
import { ProductRepository } from "../repositories/productRepository";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

export async function createSale(data: any, userId?: number) {
  return prisma.$transaction(async (tx) => {
    // 1. Validar e Incrementar/Decrementar Estoque
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product)
        throw new AppError(404, `Product ID ${item.productId} not found`);
      if (product.stockQuantity < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for product: ${product.name}`,
        );
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    // 2. Criar a Venda
    const newSale = await tx.sale.create({
      data: {
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        cashRegisterId: data.cashRegisterId,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    await AuditRepository.log(
      userId,
      "SALE_CREATE",
      `Registered sale ID ${newSale.id} - Total: ${data.totalAmount}`,
    );
    return newSale;
  });
}
