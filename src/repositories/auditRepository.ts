import { prisma } from "../lib/prisma";
export const AuditRepository = {
  async log(userId: number | undefined, action: string, details: string) {
    return prisma.auditLog.create({ data: { userId, action, details } });
  },
};
