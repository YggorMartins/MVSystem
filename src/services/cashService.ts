import { prisma } from "../lib/prisma";

type OpenCashInput = {
  initialAmount: number;
};

type MovementInput = {
  cashRegisterId: number;
  type: "in" | "out";
  amount: number;
  description?: string;
};

export function open(data: OpenCashInput) {
  return prisma.cashRegister.create({
    data: {
      openedAt: new Date(),
      initialAmount: data.initialAmount,
      status: "open",
    },
  });
}

export function close(id: number) {
  return prisma.cashRegister.update({
    where: { id },
    data: {
      closedAt: new Date(),
      status: "closed",
    },
  });
}

export function movement(data: MovementInput) {
  return prisma.cashMovement.create({
    data: {
      cashRegisterId: data.cashRegisterId,
      type: data.type,
      amount: data.amount,
      description: data.description,
    },
  });
}