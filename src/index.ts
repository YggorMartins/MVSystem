import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes";
import { env } from "./lib/env";
import { errorHandler } from "./middleware/errorMiddleware";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

const app = express();

// Configurações de Segurança HTTP e Acesso
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origem não permitida pelo CORS"));
    },
  }),
);

app.use(express.json({ limit: "32kb", strict: true }));
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
app.use("/api", routes);

// Tratamento de Erro Global (Sempre após as rotas)
app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada" }));
app.use(errorHandler);

if (env.nodeEnv !== "test") {
  const server = app.listen(env.port, () => {
    logger.info(`MVSystem API running securely on port ${env.port} [${env.nodeEnv}]`);
  });

  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  const shutdown = (signal: string) => {
    logger.info(`${signal} recebido; encerrando servidor`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

export { app };
