import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AppError } from "../middleware/errorMiddleware";
type OpenCashInput = {
  initialAmount: number;
};

type MovementInput = {
  cashRegisterId: number;
  type: "in" | "out";
  amount: number;
  description?: string;
};

export async function open(data: OpenCashInput) {
  const openRegister = await prisma.cashRegister.findFirst({
    where: { status: "open" },
  });

  if (openRegister) {
    throw new AppError(400, "There is already an open cash register");
  }

  return prisma.cashRegister.create({
    data: {
      openedAt: new Date(),
      initialAmount: data.initialAmount,
      status: "open",
    },
  });
}

export async function close(id: number) {
  const register = await prisma.cashRegister.findUnique({
    where: { id },
  });

  if (!register) {
    throw new AppError(404, "Cash register not found");
  }

  if (register.status === "closed") {
    throw new AppError(400, "Cash register is already closed");
  }

  return prisma.cashRegister.update({
    where: { id },
    data: {
      closedAt: new Date(),
      status: "closed",
    },
  });
}

export async function movement(data: MovementInput) {
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

  return prisma.cashMovement.create({
    data: {
      cashRegisterId: data.cashRegisterId,
      type: data.type,
      amount: data.amount,
      description: data.description,
    },
  });
}
