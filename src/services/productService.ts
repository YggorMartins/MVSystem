import { prisma } from "../lib/prisma";

type CreateProductInput = {
  name: string;
  barcode: string;
  price: number;
  stockQuantity: number;
};

export function create(data: CreateProductInput) {
  return prisma.product.create({ data });
}

export function list() {
  return prisma.product.findMany();
}

export function findByBarcode(barcode: string) {
  return prisma.product.findUnique({
    where: { barcode },
  });
}