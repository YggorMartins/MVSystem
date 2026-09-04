import { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

type CreateSaleInput = {
  idempotencyKey: string;
  paymentMethod: PaymentMethod;
  cashRegisterId: number;
  items: Array<{ productId: number; quantity: number }>;
  customerId?: number;
};

export async function createSale(data: CreateSaleInput, userId?: number) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existingSale = await tx.sale.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
            include: {
              items: { include: { product: true } },
              customer: true,
              fiscalDocument: true,
            },
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
          if (data.paymentMethod === "fiado") {
            if (!data.customerId)
              throw new AppError(400, "Informe o cliente para a venda no fiado");
            const customer = await tx.customer.findUnique({
              where: { id: data.customerId },
              select: { id: true },
            });
            if (!customer) throw new AppError(404, "Cliente não encontrado");
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
              customerId: data.paymentMethod === "fiado" ? data.customerId : null,
              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
            },
            include: {
              items: { include: { product: true } },
              customer: true,
              fiscalDocument: true,
            },
          });

          await AuditRepository.log(
            userId,
            "SALE_CREATE",
            `Venda ${sale.id} registrada no valor de ${totalAmount.toFixed(2)}`,
            tx,
          );
          return sale;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existingSale = await prisma.sale.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include: { items: true },
        });
        if (existingSale) return existingSale;
      }
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
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
      customer: true,
      fiscalDocument: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function findSale(id: number) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      cashRegister: true,
      customer: true,
      fiscalDocument: true,
    },
  });
  if (!sale) throw new AppError(404, "Venda não encontrada");
  return sale;
}

export async function cancelSale(id: number, userId?: number) {
  return prisma.$transaction(
    async (tx) => {
      const [locked] = await tx.$queryRaw<
        Array<{
          id: number;
          cancelledAt: Date | null;
          paymentMethod: string;
          creditPaidAt: Date | null;
        }>
      >`
      SELECT "id", "cancelledAt", "paymentMethod"::text, "creditPaidAt"
      FROM "Sale" WHERE "id" = ${id} FOR UPDATE
    `;
      if (!locked) throw new AppError(404, "Venda não encontrada");
      if (locked.cancelledAt) throw new AppError(409, "Esta venda já foi cancelada");
      if (locked.paymentMethod === "fiado" && locked.creditPaidAt) {
        throw new AppError(409, "Não é possível cancelar um fiado já recebido");
      }
      const items = await tx.saleItem.findMany({
        where: { saleId: id },
        select: { productId: true, quantity: true },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
      const sale = await tx.sale.update({
        where: { id },
        data: { cancelledAt: new Date() },
        include: { items: true, customer: true },
      });
      await tx.fiscalDocument.updateMany({
        where: { saleId: id },
        data: { status: "cancelled", cancelledAt: new Date() },
      });
      await AuditRepository.log(
        userId,
        "SALE_CANCEL",
        `Venda ${id} cancelada e estoque devolvido`,
        tx,
      );
      return sale;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
