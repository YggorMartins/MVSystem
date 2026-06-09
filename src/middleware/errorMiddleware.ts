import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

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

  logger.error(`Internal Server Error: ${err.message}`, { stack: err.stack });
  return res.status(500).json({ error: "Internal server error" });
}
