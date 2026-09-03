import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
export const UserRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },
  async create(data: { email: string; passwordHash: string; role: UserRole }) {
    return prisma.user.create({ data });
  },
  async listAll() {
    return prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
  },
};
