
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const auth = (req: Request, res: Response, next: NextFunction) => {

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token missing" });

  try {
    const secret = process.env.JWT_SECRET || "fallback_secret";

    const payload = jwt.verify(token, secret) as {
      userId: number;
      role: string;
    };

    req.user = payload; 
    next(); 
    
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
