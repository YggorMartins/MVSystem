import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

type OpenCashInput = {
  initialAmount: number;
};

type MovementInput = {
  cashRegisterId: number;
  type: "in" | "out";
  amount: number;
  description?: string;
};

export async function open(data: OpenCashInput, userId?: number) {
  const openRegister = await prisma.cashRegister.findFirst({
    where: { status: "open" },
  });

  if (openRegister) {
    throw new AppError(400, "There is already an open cash register");
  }

  const register = await prisma.cashRegister.create({
    data: {
      openedAt: new Date(),
      initialAmount: data.initialAmount,
      status: "open",
    },
  });

  await AuditRepository.log(
    userId,
    "CASH_OPEN",
    `Opened cash register ${register.id}`,
  );

  return register;
}

export async function close(id: number, userId?: number) {
  const register = await prisma.cashRegister.findUnique({
    where: { id },
  });

  if (!register) {
    throw new AppError(404, "Cash register not found");
  }

  if (register.status === "closed") {
    throw new AppError(400, "Cash register is already closed");
  }

  const updated = await prisma.cashRegister.update({
    where: { id },
    data: {
      closedAt: new Date(),
      status: "closed",
    },
  });

  await AuditRepository.log(userId, "CASH_CLOSE", `Closed cash register ${id}`);

  return updated;
}

export async function movement(data: MovementInput, userId?: number) {
  const register = await prisma.cashRegister.findUnique({
    where: { id: data.cashRegisterId },
  });

  if (!register) {
    throw new AppError(404, "Cash register not found");
  }

  if (register.status === "closed") {
    throw new AppError(400, "Cannot add movements to a closed cash register");
  }

  const movements = await prisma.cashMovement.findMany({
    where: { cashRegisterId: data.cashRegisterId },
  });

  const balance = movements.reduce((total, movement) => {
    return movement.type === "in"
      ? total + movement.amount
      : total - movement.amount;
  }, register.initialAmount);

  if (data.type === "out" && data.amount > balance) {
    throw new AppError(400, "Insufficient funds in cash register");
  }

  const movement = await prisma.cashMovement.create({
    data: {
      cashRegisterId: data.cashRegisterId,
      type: data.type,
      amount: data.amount,
      description: data.description,
    },
  });

  await AuditRepository.log(
    userId,
    "CASH_MOVEMENT",
    `Cash register ${data.cashRegisterId} movement ${data.type} ${data.amount}`,
  );

  return movement;
}

export async function listRegisters() {
  return prisma.cashRegister.findMany({
    include: { movements: true },
    orderBy: { openedAt: "desc" },
  });
}

export async function listMovements(cashRegisterId: number) {
  const register = await prisma.cashRegister.findUnique({
    where: { id: cashRegisterId },
  });

  if (!register) {
    throw new AppError(404, "Cash register not found");
  }

  return prisma.cashMovement.findMany({
    where: { cashRegisterId },
    orderBy: { createdAt: "asc" },
  });
}
