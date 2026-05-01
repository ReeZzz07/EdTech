import * as Sentry from "@sentry/react";

export function initFrontendSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
  });
}
