import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const create = async (data: { name: string; barcode: string; price: number; stockQuantity: number }) => {
  const product = await prisma.product.create({ data });
  return product;
};

export const list = async () => {
  return await prisma.product.findMany();
};

export const findByBarcode = async (barcode: string) => {
  return await prisma.product.findUnique({ where: { barcode } });
};