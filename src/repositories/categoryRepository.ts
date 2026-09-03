import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;
export const CategoryRepository = {
  async create(name: string, db: DbClient = prisma) {
    return db.category.create({ data: { name } });
  },
  async findByName(name: string) {
    return prisma.category.findUnique({ where: { name } });
  },
  async listAll() {
    return prisma.category.findMany({ orderBy: { name: "asc" }, take: 500 });
  },
};
