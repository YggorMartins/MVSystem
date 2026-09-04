import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";
type Input = {
  name?: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  active?: boolean;
};
export const list = () => prisma.supplier.findMany({ orderBy: { name: "asc" }, take: 500 });
export async function create(data: Required<Pick<Input, "name">> & Input, userId?: number) {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        document: data.document || null,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
    await AuditRepository.log(
      userId,
      "SUPPLIER_CREATE",
      `Fornecedor ${supplier.id} (${supplier.name}) criado`,
    );
    return supplier;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError(409, "Este CPF/CNPJ já pertence a outro fornecedor");
    throw error;
  }
}
export async function update(id: number, data: Input, userId?: number) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        ...(data.document !== undefined ? { document: data.document || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
      },
    });
    await AuditRepository.log(userId, "SUPPLIER_UPDATE", `Fornecedor ${supplier.id} atualizado`);
    return supplier;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new AppError(404, "Fornecedor não encontrado");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError(409, "Este CPF/CNPJ já pertence a outro fornecedor");
    throw error;
  }
}
