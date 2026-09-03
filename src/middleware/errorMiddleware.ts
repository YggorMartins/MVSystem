import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Já existe um registro com estes dados" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registro não encontrado" });
    }
  }

  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    return res.status(400).json({ error: "JSON inválido" });
  }

  logger.error(`Internal Server Error: ${err.message}`, { stack: err.stack });
  return res.status(500).json({ error: "Erro interno do servidor" });
}
