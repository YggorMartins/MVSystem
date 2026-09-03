import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;
export const ProductRepository = {
  async create(data: {
    name: string;
    barcode: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
  }, db: DbClient = prisma) {
    return db.product.create({ data, include: { category: true } });
  },
  async findByBarcode(barcode: string) {
    return prisma.product.findUnique({ where: { barcode } });
  },
  async findById(id: number) {
    return prisma.product.findUnique({ where: { id } });
  },
  async updateStock(id: number, quantity: number, db: DbClient = prisma) {
    return db.product.update({
      where: { id },
      data: { stockQuantity: quantity },
    });
  },
  async listAll() {
    return prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
      take: 500,
    });
  },
};
