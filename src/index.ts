import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { env } from "./lib/env";
import { errorHandler } from "./middleware/errorMiddleware";
import { logger } from "./lib/logger";

const app = express();

// Configurações de Segurança HTTP e Acesso
app.use(helmet());
app.use(
  cors({ origin: env.nodeEnv === "production" ? "https://meusite.com" : "*" }),
);

// Rate Limiting para evitar força bruta e DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use("/api", limiter);

app.use(express.json());
app.use("/api", routes);

// Tratamento de Erro Global (Sempre após as rotas)
app.use(errorHandler);

if (env.nodeEnv !== "test") {
  app.use(errorHandler);
  app.listen(env.port, () => {
    logger.info(
      `MVSystem API running securely on port ${env.port} [${env.nodeEnv}]`,
    );
  });
}

export { app };
