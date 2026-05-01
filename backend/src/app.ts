import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { errorHandler } from "./middleware/errorHandler";
import { apiRateLimit } from "./middleware/rateLimit";
import { authRouter } from "./routes/auth";
import { clansRouter } from "./routes/clans";
import { coinsRouter } from "./routes/coins";
import { filesRouter } from "./routes/files";
import { healthRouter } from "./routes/health";
import { paymentsRouter } from "./routes/payments";
import { problemsRouter } from "./routes/problems";
import { subjectsRouter } from "./routes/subjects";
import { telegramWebhookRouter } from "./routes/telegramWebhook";
import { userRouter } from "./routes/user";
import { logger } from "./utils/logger";

export const app = express();

// За Traefik/Coolify приходят X-Forwarded-*; иначе express-rate-limit кидает ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
if (process.env.TRUST_PROXY !== "0") {
  const hops = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1;
  app.set("trust proxy", Number.isFinite(hops) && hops >= 0 ? hops : 1);
}

const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173,https://web.telegram.org")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (o, cb) => {
      if (!o) {
        return cb(null, true);
      }
      if (corsOrigins.includes(o) || o.startsWith("https://t.me") || o.includes("web.telegram.org")) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) =>
        req.url === "/api/health" || req.url === "/" || req.url.startsWith("/api/telegram/webhook"),
    },
  }),
);

app.get("/", (_req, res) => {
  res.json({ name: "ege-pro-backend" });
});

app.use("/api/health", healthRouter);
app.use("/api/telegram/webhook", telegramWebhookRouter);
app.use("/api", apiRateLimit);
app.use("/api/auth", authRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/user", userRouter);
app.use("/api/coins", coinsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/clans", clansRouter);
app.use("/api/files", filesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Not found" } });
});

app.use(errorHandler);
