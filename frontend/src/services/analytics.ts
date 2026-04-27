import posthog from "posthog-js";

let started = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  if (!key || started) return;
  started = true;
  posthog.init(key, {
    api_host: host,
    persistence: "localStorage",
    capture_pageview: false,
  });
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (!import.meta.env.VITE_POSTHOG_KEY) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}
