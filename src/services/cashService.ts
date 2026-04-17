import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const open = async (data: { initialAmount: number }) => {
  const register = await prisma.cashRegister.create({
    data: {
      openedAt: new Date(),
      initialAmount: data.initialAmount,
      status: 'open',
    },
  });
  return register;
};

export const close = async (id: number, data: {}) => {
  const register = await prisma.cashRegister.update({
    where: { id },
    data: {
      closedAt: new Date(),
      status: 'closed',
    },
  });
  return register;
};

export const movement = async (data: {
  cashRegisterId: number;
  type: 'in' | 'out';
  amount: number;
  description?: string;
}) => {
  const movement = await prisma.cashMovement.create({
    data: {
      cashRegisterId: data.cashRegisterId,
      type: data.type,
      amount: data.amount,
      description: data.description,
    },
  });
  return movement;
};