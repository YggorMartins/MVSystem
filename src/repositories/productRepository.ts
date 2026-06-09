import { prisma } from "../lib/prisma";
export const ProductRepository = {
  async create(data: {
    name: string;
    barcode: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
  }) {
    return prisma.product.create({ data, include: { category: true } });
  },
  async findByBarcode(barcode: string) {
    return prisma.product.findUnique({ where: { barcode } });
  },
  async findById(id: number) {
    return prisma.product.findUnique({ where: { id } });
  },
  async updateStock(id: number, quantity: number, tx?: any) {
    const client = tx || prisma;
    return client.product.update({
      where: { id },
      data: { stockQuantity: quantity },
    });
  },
  async listAll() {
    return prisma.product.findMany({ include: { category: true } });
  },
};
