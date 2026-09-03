import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;
export const AuditRepository = {
  async log(userId: number | undefined, action: string, details: string, db: DbClient = prisma) {
    return db.auditLog.create({ data: { userId, action, details } });
  },
  async listAll() {
    return prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },
};
