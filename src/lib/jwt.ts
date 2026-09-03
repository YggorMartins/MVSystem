import jwt from "jsonwebtoken";
import { env } from "./env";

export type JwtPayload = {
  userId: number;
};

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: "HS256",
    audience: "mvsystem-api",
    issuer: "mvsystem",
    expiresIn: "1h",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
    audience: "mvsystem-api",
    issuer: "mvsystem",
  }) as JwtPayload;
}
