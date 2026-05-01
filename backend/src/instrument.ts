import * as Sentry from "@sentry/node";
import { ZodError } from "zod";
import { HttpError } from "./utils/httpError";

let sentryReady = false;

export function initBackendSentry() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
  });
  sentryReady = true;
}

/** Не шумим в Sentry на ожидаемые 4xx и валидацию. */
export function captureSentryExceptionIfUseful(err: unknown, inferredHttpStatus?: number) {
  if (!sentryReady) return;
  if (err instanceof ZodError) return;
  if (err instanceof HttpError && err.status < 500) return;
  if (typeof inferredHttpStatus === "number" && inferredHttpStatus < 500) return;
  Sentry.captureException(err);
}
