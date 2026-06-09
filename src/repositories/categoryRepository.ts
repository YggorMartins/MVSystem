import { prisma } from "../lib/prisma";
export const CategoryRepository = {
  async create(name: string) {
    return prisma.category.create({ data: { name } });
  },
  async findByName(name: string) {
    return prisma.category.findUnique({ where: { name } });
  },
  async listAll() {
    return prisma.category.findMany();
  },
};
