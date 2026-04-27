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
import { problemsRouter } from "./routes/problems";
import { subjectsRouter } from "./routes/subjects";
import { userRouter } from "./routes/user";
import { logger } from "./utils/logger";

export const app = express();

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
      ignore: (req) => req.url === "/api/health" || req.url === "/",
    },
  }),
);

app.get("/", (_req, res) => {
  res.json({ name: "ege-pro-backend" });
});

app.use("/api/health", healthRouter);
app.use("/api", apiRateLimit);
app.use("/api/auth", authRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/user", userRouter);
app.use("/api/coins", coinsRouter);
app.use("/api/clans", clansRouter);
app.use("/api/files", filesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Not found" } });
});

app.use(errorHandler);
