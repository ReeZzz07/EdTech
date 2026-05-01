import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { capture } from "../../services/analytics";
import { useUserStore } from "../../stores/userStore";
import { getApiErrorMeta } from "../../utils/apiError";

type Props = {
  subjectId: string;
  problemId: string;
};

export function PeerHelpPanel({ subjectId, problemId }: Props) {
  const navigate = useNavigate();
  const refreshMe = useUserStore((s) => s.refreshMe);
  const [rewardCoins, setRewardCoins] = useState(50);
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      await api.post("/api/peer-help", {
        subjectId,
        problemId,
        body,
        rewardCoins,
      });
      await refreshMe();
      capture("peer_help_create", { subjectId, problemId, rewardCoins });
      navigate("/peer-help");
    } catch (e) {
      setErr(getApiErrorMeta(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-tg bg-tg-secondary p-4">
      <p className="text-sm font-semibold text-tg-text">Peer-помощь</p>
      <p className="mt-1 text-xs text-tg-hint">
        Попроси объяснение у другого ученика за ЕГЭCOIN (10–500). Монеты блокируются до отмены или выполнения.
      </p>
      {err ? <p className="mt-2 text-sm text-red-800">{err}</p> : null}
      <label className="mt-3 block text-xs text-tg-hint">
        Награда (EGC)
        <input
          type="number"
          min={10}
          max={500}
          className="mt-1 w-full rounded-lg border border-tg bg-tg-bg px-2 py-2 text-tg-text"
          value={rewardCoins}
          onChange={(e) => setRewardCoins(Number(e.target.value))}
        />
      </label>
      <label className="mt-2 block text-xs text-tg-hint">
        Что нужно объяснить
        <textarea
          className="mt-1 min-h-[80px] w-full rounded-lg border border-tg bg-tg-bg p-2 text-sm text-tg-text placeholder:text-tg-hint"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Кратко: какой шаг или тема непонятны"
        />
      </label>
      <button
        type="button"
        disabled={busy || body.trim().length < 5}
        className="mt-3 w-full rounded-xl bg-tg-link py-3 text-sm font-medium text-[var(--tg-theme-button-text-color,#fff)] disabled:opacity-45"
        onClick={() => void submit()}
      >
        {busy ? "Отправка…" : "Создать запрос"}
      </button>
    </section>
  );
}
