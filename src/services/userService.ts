import bcrypt from "bcryptjs";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

type CreateInput = { email: string; password: string; role: UserRole };
type UpdateInput = { email?: string; password?: string; role?: UserRole; active?: boolean };
const selection = {
  id: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

export function list() {
  return prisma.user.findMany({ select: selection, orderBy: { email: "asc" } });
}

export async function create(data: CreateInput, actorId?: number) {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
        role: data.role,
      },
      select: selection,
    });
    await AuditRepository.log(
      actorId,
      "USER_CREATE",
      `Usuário ${user.email} criado como ${user.role}`,
    );
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError(409, "Já existe um usuário com este e-mail");
    throw error;
  }
}

export async function update(id: number, data: UpdateInput, actorId?: number) {
  if (id === actorId && data.active === false)
    throw new AppError(409, "Você não pode bloquear seu próprio usuário");
  const current = await prisma.user.findUnique({
    where: { id },
    select: { role: true, active: true },
  });
  if (!current) throw new AppError(404, "Usuário não encontrado");
  if (
    current.active &&
    current.role === "admin" &&
    (data.active === false || (data.role && data.role !== "admin"))
  ) {
    const activeAdmins = await prisma.user.count({ where: { role: "admin", active: true } });
    if (activeAdmins <= 1)
      throw new AppError(409, "O sistema deve manter ao menos um administrador ativo");
  }
  const changes: Prisma.UserUpdateInput = {};
  if (data.email !== undefined) changes.email = data.email;
  if (data.role !== undefined) changes.role = data.role;
  if (data.active !== undefined) changes.active = data.active;
  if (data.password !== undefined) changes.passwordHash = await bcrypt.hash(data.password, 12);
  try {
    const user = await prisma.user.update({ where: { id }, data: changes, select: selection });
    await AuditRepository.log(actorId, "USER_UPDATE", `Usuário ${user.email} atualizado`);
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new AppError(404, "Usuário não encontrado");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError(409, "Já existe um usuário com este e-mail");
    throw error;
  }
}
