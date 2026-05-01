import axios, { type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "egepro_token";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    __retryCount?: number;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "",
  timeout: 120_000,
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) {
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

const RETRY_STATUSES = new Set([408, 425, 429, 502, 503, 504]);
const MAX_RETRIES = 2;

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

api.interceptors.response.use(
  (res) => res,
  async (err: unknown) => {
    const ax = axios.isAxiosError(err) ? err : null;
    const cfg = ax?.config as InternalAxiosRequestConfig | undefined;
    if (!ax || !cfg) throw err;
    const method = (cfg.method ?? "get").toLowerCase();
    if (method !== "get" && method !== "head") throw err;
    const status = ax.response?.status;
    const retryable =
      ax.code === "ECONNABORTED" ||
      ax.code === "ERR_NETWORK" ||
      (typeof status === "number" && RETRY_STATUSES.has(status));
    if (!retryable) throw err;
    const n = (cfg.__retryCount ?? 0) + 1;
    if (n > MAX_RETRIES) throw err;
    cfg.__retryCount = n;
    await delay(350 * n);
    return api(cfg);
  },
);

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
