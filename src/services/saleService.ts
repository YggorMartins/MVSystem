import { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

type CreateSaleInput = {
  idempotencyKey: string;
  paymentMethod: PaymentMethod;
  cashRegisterId: number;
  items: Array<{ productId: number; quantity: number }>;
};

export async function createSale(data: CreateSaleInput, userId?: number) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingSale = await tx.sale.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include: { items: true },
        });
        if (existingSale) return existingSale;

        const [cashRegister] = await tx.$queryRaw<Array<{ status: string }>>`
          SELECT "status"::text AS "status"
          FROM "CashRegister"
          WHERE "id" = ${data.cashRegisterId}
          FOR UPDATE
        `;
        if (!cashRegister) throw new AppError(404, "Caixa não encontrado");
        if (cashRegister.status !== "open") {
          throw new AppError(409, "Não é possível vender em um caixa fechado");
        }

        const productIds = [...new Set(data.items.map((item) => item.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true },
        });
        const productsById = new Map(products.map((product) => [product.id, product]));

        const items = data.items.map((item) => {
          const product = productsById.get(item.productId);
          if (!product) throw new AppError(404, `Produto ${item.productId} não encontrado`);
          const quantity = new Prisma.Decimal(item.quantity);
          return {
            productId: item.productId,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            lineTotal: product.price.mul(quantity).toDecimalPlaces(2),
          };
        });

        const totalAmount = items.reduce(
          (total, item) => total.add(item.lineTotal),
          new Prisma.Decimal(0),
        );

        for (const item of items) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (updated.count !== 1) {
            throw new AppError(409, `Estoque insuficiente para ${item.productName}`);
          }
        }

        const sale = await tx.sale.create({
          data: {
            idempotencyKey: data.idempotencyKey,
            totalAmount,
            paymentMethod: data.paymentMethod,
            cashRegisterId: data.cashRegisterId,
            items: {
              create: items.map((item) => ({
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
          `Venda ${sale.id} registrada no valor de ${totalAmount.toFixed(2)}`,
          tx,
        );
        return sale;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existingSale = await prisma.sale.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include: { items: true },
        });
        if (existingSale) return existingSale;
      }
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === "P2034";
      if (!retryable || attempt === 3) throw error;
    }
  }
  throw new AppError(503, "Não foi possível concluir a venda");
}

export async function listSales() {
  return prisma.sale.findMany({
    include: {
      items: { include: { product: true } },
      cashRegister: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
