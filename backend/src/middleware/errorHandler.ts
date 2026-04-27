import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

type ErrWithStatus = Error & { status?: number; code?: string };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { message: "Validation error", code: "validation", details: err.flatten() } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, code: err.code } });
  }
  const e = err as ErrWithStatus;
  const status = typeof e.status === "number" ? e.status : 500;
  const message = e instanceof Error && e.message ? e.message : "Internal Server Error";
  if (status >= 500) {
    logger.error({ err: e, stack: e?.stack });
  }
  return res.status(status).json({
    error: {
      message,
      code: e.code,
    },
  });
};
