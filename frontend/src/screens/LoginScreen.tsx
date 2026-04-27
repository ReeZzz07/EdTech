import { useState } from "react";
import { useUserStore } from "../stores/userStore";

export function LoginScreen() {
  const { loginWithDevJwt, error, loading } = useUserStore();
  const [jwt, setJwt] = useState(import.meta.env.VITE_DEV_JWT ?? "");

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">ЕГЭ PRO</h1>
        <p className="mt-2 text-sm text-zinc-500">Откройте мини-приложение из Telegram или введите dev JWT.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <label className="flex w-full max-w-sm flex-col gap-1 text-sm">
        <span>Bearer токен (локальная разработка)</span>
        <textarea
          className="min-h-[100px] rounded-lg border border-zinc-300 p-2 font-mono text-xs"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="eyJ..."
        />
      </label>
      <button
        type="button"
        disabled={loading || !jwt.trim()}
        className="rounded-xl bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
        onClick={() => void loginWithDevJwt(jwt.trim())}
      >
        {loading ? "…" : "Войти"}
      </button>
    </div>
  );
}
