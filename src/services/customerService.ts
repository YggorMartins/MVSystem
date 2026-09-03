import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

export function list() {
  return prisma.customer.findMany({ orderBy: { name: "asc" }, take: 500 });
}

export async function create(data: { name: string; phone?: string }, userId?: number) {
  const customer = await prisma.customer.create({
    data: { name: data.name, phone: data.phone || null },
  });
  await AuditRepository.log(userId, "CUSTOMER_CREATE", `Cliente ${customer.id} cadastrado`);
  return customer;
}

export function listCredits() {
  return prisma.sale.findMany({
    where: { paymentMethod: "fiado", cancelledAt: null },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function settleCredit(saleId: number, userId?: number) {
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale || sale.paymentMethod !== "fiado")
    throw new AppError(404, "Venda fiada não encontrada");
  if (sale.creditPaidAt) throw new AppError(409, "Esta venda já foi recebida");
  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: { creditPaidAt: new Date() },
    include: { customer: true },
  });
  await AuditRepository.log(userId, "CREDIT_SETTLE", `Fiado da venda ${saleId} recebido`);
  return updated;
}

export async function registerPayment(customerId: number, value: number, userId?: number) {
  return prisma.$transaction(
    async (tx) => {
      const [customer] = await tx.$queryRaw<Array<{ id: number }>>`
      SELECT "id" FROM "Customer" WHERE "id" = ${customerId} FOR UPDATE
    `;
      if (!customer) throw new AppError(404, "Cliente não encontrado");
      const debts = await tx.sale.findMany({
        where: { customerId, paymentMethod: "fiado", cancelledAt: null, creditPaidAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      const outstanding = debts.reduce(
        (sum, sale) => sum.add(sale.totalAmount.sub(sale.creditPaidAmount)),
        new Prisma.Decimal(0),
      );
      const amount = new Prisma.Decimal(value);
      if (outstanding.lte(0)) throw new AppError(409, "Este cliente não possui débito em aberto");
      if (amount.gt(outstanding))
        throw new AppError(
          400,
          `O pagamento não pode ultrapassar o saldo de ${outstanding.toFixed(2)}`,
        );
      let remaining = amount;
      for (const sale of debts) {
        if (remaining.lte(0)) break;
        const saleBalance = sale.totalAmount.sub(sale.creditPaidAmount);
        const applied = Prisma.Decimal.min(remaining, saleBalance);
        const paidAmount = sale.creditPaidAmount.add(applied);
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            creditPaidAmount: paidAmount,
            creditPaidAt: paidAmount.gte(sale.totalAmount) ? new Date() : null,
          },
        });
        remaining = remaining.sub(applied);
      }
      const payment = await tx.creditPayment.create({ data: { customerId, amount } });
      await AuditRepository.log(
        userId,
        "CREDIT_PAYMENT",
        `Cliente ${customerId} pagou ${amount.toFixed(2)}`,
        tx,
      );
      return { payment, previousBalance: outstanding, remainingBalance: outstanding.sub(amount) };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
