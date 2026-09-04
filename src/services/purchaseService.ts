import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";
type Input = {
  idempotencyKey: string;
  supplierId: number;
  invoiceNumber?: string;
  items: Array<{ productId: number; quantity: number; unitCost: number }>;
};
const include = { supplier: true, items: { include: { product: true } } } as const;
export const list = () =>
  prisma.purchase.findMany({ include, orderBy: { receivedAt: "desc" }, take: 200 });
export async function create(data: Input, userId?: number) {
  for (let attempt = 1; attempt <= 3; attempt++)
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.purchase.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
            include,
          });
          if (existing) return existing;
          const supplier = await tx.supplier.findUnique({
            where: { id: data.supplierId },
            select: { active: true },
          });
          if (!supplier) throw new AppError(404, "Fornecedor não encontrado");
          if (!supplier.active) throw new AppError(409, "Fornecedor inativo");
          const ids = data.items.map((item) => item.productId);
          const products = await tx.product.findMany({
            where: { id: { in: ids }, archivedAt: null },
            select: { id: true },
          });
          if (products.length !== ids.length)
            throw new AppError(404, "Um ou mais produtos não foram encontrados");
          const items = data.items.map((item) => ({
            ...item,
            quantity: new Prisma.Decimal(item.quantity),
            unitCost: new Prisma.Decimal(item.unitCost),
          }));
          const totalAmount = items.reduce(
            (sum, item) => sum.add(item.quantity.mul(item.unitCost).toDecimalPlaces(2)),
            new Prisma.Decimal(0),
          );
          const purchase = await tx.purchase.create({
            data: {
              idempotencyKey: data.idempotencyKey,
              supplierId: data.supplierId,
              invoiceNumber: data.invoiceNumber || null,
              totalAmount,
              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                })),
              },
            },
            include,
          });
          for (const item of items)
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity }, costPrice: item.unitCost },
            });
          await AuditRepository.log(
            userId,
            "PURCHASE_CREATE",
            `Compra ${purchase.id} recebida no valor de ${totalAmount.toFixed(2)}`,
            tx,
          );
          return purchase;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.purchase.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include,
        });
        if (existing) return existing;
        throw new AppError(409, "Esta nota já foi registrada para o fornecedor");
      }
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") ||
        attempt === 3
      )
        throw error;
    }
  throw new AppError(503, "Não foi possível registrar a compra");
}
export async function cancel(id: number, userId?: number) {
  return prisma.$transaction(
    async (tx) => {
      const [purchase] = await tx.$queryRaw<
        Array<{ cancelledAt: Date | null }>
      >`SELECT "cancelledAt" FROM "Purchase" WHERE "id"=${id} FOR UPDATE`;
      if (!purchase) throw new AppError(404, "Compra não encontrada");
      if (purchase.cancelledAt) throw new AppError(409, "Compra já cancelada");
      const items = await tx.purchaseItem.findMany({ where: { purchaseId: id } });
      for (const item of items) {
        const changed = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (changed.count !== 1)
          throw new AppError(
            409,
            "Não é possível estornar: parte do estoque recebido já foi utilizada",
          );
      }
      const result = await tx.purchase.update({
        where: { id },
        data: { cancelledAt: new Date() },
        include,
      });
      await AuditRepository.log(
        userId,
        "PURCHASE_CANCEL",
        `Compra ${id} cancelada e estoque estornado`,
        tx,
      );
      return result;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
