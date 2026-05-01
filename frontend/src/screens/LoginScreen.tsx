import { useState } from "react";
import { useUserStore } from "../stores/userStore";

export function LoginScreen() {
  const { loginWithDevJwt, error, loading } = useUserStore();
  const [jwt, setJwt] = useState(import.meta.env.VITE_DEV_JWT ?? "");

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-tg-bg p-6 text-tg-text">
      <div className="text-center">
        <h1 className="text-xl font-bold text-tg-text">ЕГЭ PRO</h1>
        <p className="mt-2 text-sm text-tg-hint">Откройте мини-приложение из Telegram или введите dev JWT.</p>
      </div>
      {error && (
        <p className="rounded-lg border border-red-500/35 bg-red-500/12 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <label className="flex w-full max-w-sm flex-col gap-1 text-sm text-tg-text">
        <span className="text-tg-hint">Bearer токен (локальная разработка)</span>
        <textarea
          className="min-h-[100px] rounded-lg border border-tg bg-tg-secondary p-2 font-mono text-xs text-tg-text placeholder:text-tg-hint"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="eyJ..."
        />
      </label>
      <button
        type="button"
        disabled={loading || !jwt.trim()}
        className="rounded-xl bg-tg-link px-6 py-3 text-[var(--tg-theme-button-text-color,#fff)] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={() => void loginWithDevJwt(jwt.trim())}
      >
        {loading ? "…" : "Войти"}
      </button>
    </div>
  );
}
