import axios from "axios";

export function getApiErrorMeta(err: unknown): { message: string; code?: string } {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { error?: { message?: string; code?: string } } | undefined;
    const m = body?.error?.message;
    const code = typeof body?.error?.code === "string" ? body.error.code : undefined;
    if (typeof m === "string" && m.trim()) return { message: m.trim(), code };
    const status = err.response?.status;
    if (status) return { message: `Ошибка сервера (${status})`, code };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: "Не удалось выполнить запрос" };
}
