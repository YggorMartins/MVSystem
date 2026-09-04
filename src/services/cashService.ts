import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

type OpenCashInput = { initialAmount: number };
type CloseCashInput = { closingAmount: number };
type MovementInput = {
  cashRegisterId: number;
  type: "in" | "out";
  amount: number;
  description?: string;
};

export async function open(data: OpenCashInput, userId?: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const register = await tx.cashRegister.create({
        data: { openedAt: new Date(), initialAmount: data.initialAmount, status: "open" },
      });
      await AuditRepository.log(userId, "CASH_OPEN", `Caixa ${register.id} aberto`, tx);
      return register;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "Já existe um caixa aberto");
    }
    throw error;
  }
}

export async function close(id: number, data: CloseCashInput, userId?: number) {
  return prisma.$transaction(
    async (tx) => {
      const [register] = await tx.$queryRaw<Array<{ status: string }>>`
      SELECT "status"::text AS "status" FROM "CashRegister" WHERE "id" = ${id} FOR UPDATE
    `;
      if (!register) throw new AppError(404, "Caixa não encontrado");
      if (register.status !== "open") throw new AppError(409, "O caixa já está fechado");

      const updated = await tx.cashRegister.update({
        where: { id },
        data: { closedAt: new Date(), closingAmount: data.closingAmount, status: "closed" },
      });
      await AuditRepository.log(
        userId,
        "CASH_CLOSE",
        `Caixa ${id} fechado com valor contado ${updated.closingAmount?.toFixed(2)}`,
        tx,
      );
      return updated;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function movement(data: MovementInput, userId?: number) {
  return prisma.$transaction(
    async (tx) => {
      const [register] = await tx.$queryRaw<
        Array<{ status: string; initialAmount: Prisma.Decimal }>
      >`
      SELECT "status"::text AS "status", "initialAmount"
      FROM "CashRegister" WHERE "id" = ${data.cashRegisterId} FOR UPDATE
    `;
      if (!register) throw new AppError(404, "Caixa não encontrado");
      if (register.status !== "open") {
        throw new AppError(409, "Não é possível movimentar um caixa fechado");
      }

      const movements = await tx.cashMovement.findMany({
        where: { cashRegisterId: data.cashRegisterId },
        select: { type: true, amount: true },
      });
      const balance = movements.reduce(
        (total, item) =>
          item.type === "cash_in" ? total.add(item.amount) : total.sub(item.amount),
        register.initialAmount,
      );
      const amount = new Prisma.Decimal(data.amount);
      if (data.type === "out" && amount.greaterThan(balance)) {
        throw new AppError(409, "Saldo insuficiente no caixa");
      }

      const movement = await tx.cashMovement.create({
        data: {
          cashRegisterId: data.cashRegisterId,
          type: data.type === "in" ? "cash_in" : "cash_out",
          amount,
          description: data.description,
        },
      });
      await AuditRepository.log(
        userId,
        "CASH_MOVEMENT",
        `Movimento ${data.type} de ${amount.toFixed(2)} no caixa ${data.cashRegisterId}`,
        tx,
      );
      return movement;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function listRegisters() {
  const registers = await prisma.cashRegister.findMany({
    include: {
      movements: true,
      sales: {
        where: { paymentMethod: "dinheiro", cancelledAt: null },
        select: { totalAmount: true },
      },
    },
    orderBy: { openedAt: "desc" },
    take: 100,
  });
  return registers.map((register) => {
    const withMovements = register.movements.reduce(
      (total, movement) =>
        movement.type === "cash_in" ? total.add(movement.amount) : total.sub(movement.amount),
      register.initialAmount,
    );
    const expectedBalance = register.sales.reduce(
      (total, sale) => total.add(sale.totalAmount),
      withMovements,
    );
    return {
      ...register,
      expectedBalance,
      difference: register.closingAmount?.sub(expectedBalance) ?? null,
    };
  });
}

export async function listMovements(cashRegisterId: number) {
  const exists = await prisma.cashRegister.findUnique({
    where: { id: cashRegisterId },
    select: { id: true },
  });
  if (!exists) throw new AppError(404, "Caixa não encontrado");
  return prisma.cashMovement.findMany({
    where: { cashRegisterId },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
}
