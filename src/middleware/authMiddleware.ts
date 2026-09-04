import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { AppError } from "./errorMiddleware";
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";

export async function auth(req: Request, _res: Response, next: NextFunction) {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
  const token = match?.[1];
  if (!token) throw new AppError(401, "Token de acesso não informado");

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, active: true },
    });
    if (!user || !user.active) throw new AppError(401, "Usuário inativo ou token inválido");
    req.user = { userId: user.id, role: user.role };
    return next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, "Token de acesso inválido ou expirado");
  }
}

export function allowRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, "Não autenticado");
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "Você não tem permissão para esta operação");
    }
    next();
  };
}
