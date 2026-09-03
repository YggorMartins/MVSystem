import "dotenv/config";

const required = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT deve ser um inteiro entre 1 e 65535");
}

const jwtSecret = process.env.JWT_SECRET as string;
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve possuir pelo menos 32 caracteres");
}

export const env = {
  port,
  jwtSecret,
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
