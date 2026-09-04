import { randomInt, randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";
function accessKey() {
  return Array.from({ length: 44 }, () => randomInt(0, 10)).join("");
}
export async function issueSimulation(saleId: number, userId?: number) {
  if (env.fiscalMode !== "simulation")
    throw new AppError(503, "Emissão fiscal simulada desabilitada");
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { fiscalDocument: true },
  });
  if (!sale) throw new AppError(404, "Venda não encontrada");
  if (sale.cancelledAt)
    throw new AppError(409, "Não é possível emitir documento para venda cancelada");
  if (sale.fiscalDocument) return sale.fiscalDocument;
  return prisma.$transaction(async (tx) => {
    const document = await tx.fiscalDocument.create({
      data: {
        saleId,
        environment: "simulation",
        status: "authorized_simulation",
        accessKey: accessKey(),
        protocol: `SIM-${randomUUID()}`,
      },
    });
    await AuditRepository.log(
      userId,
      "NFCE_SIMULATE",
      `NFC-e simulada para venda ${saleId}; sem validade fiscal`,
      tx,
    );
    return document;
  });
}
