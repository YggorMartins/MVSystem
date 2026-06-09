import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { AppError } from "./errorMiddleware";

export function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new AppError(401, "Token missing");

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    throw new AppError(401, "Invalid token");
  }
}

export function allowRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, "Unauthorized");
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "Access denied: insufficient privileges");
    }
    next();
  };
}
