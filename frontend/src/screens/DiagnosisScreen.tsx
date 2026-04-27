import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";

type StatusRes = { status: string };
type DiagnosisRes = {
  status: string;
  diagnosis: null | {
    overallScore: number;
    coinsEarned: number;
    steps: unknown[];
    recommendations: unknown[];
    errors: unknown[];
  };
  problem?: { imageUrl: string };
};

export function DiagnosisScreen() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const refreshMe = useUserStore((s) => s.refreshMe);
  const [phase, setPhase] = useState<"wait" | "done" | "error">("wait");
  const [payload, setPayload] = useState<DiagnosisRes | null>(null);

  useEffect(() => {
    capture("screen_view", { screen: "diagnosis", problemId });
  }, [problemId]);

  useEffect(() => {
    if (!problemId) return;
    let cancelled = false;
    let timer: number | undefined;

    const run = async () => {
      try {
        const { data: st } = await api.get<StatusRes>(`/api/problems/${problemId}/status`);
        if (cancelled) return;
        if (st.status === "error") {
          setPhase("error");
          return;
        }
        if (st.status !== "completed") {
          timer = window.setTimeout(run, 2500);
          return;
        }
        const { data } = await api.get<DiagnosisRes>(`/api/problems/${problemId}/diagnosis`);
        if (cancelled) return;
        setPayload(data);
        setPhase("done");
        await refreshMe();
        capture("diagnosis_viewed", { problemId });
      } catch {
        if (!cancelled) setPhase("error");
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [problemId, refreshMe]);

  if (!problemId) return null;

  if (phase === "wait" || (phase === "done" && !payload?.diagnosis)) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-center text-zinc-600">ИИ анализирует решение…</p>
      </div>
    );
  }

  if (phase === "error" || !payload?.diagnosis) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-red-600">Не удалось завершить анализ</p>
        <button type="button" className="rounded-xl bg-blue-600 px-6 py-3 text-white" onClick={() => navigate("/")}>
          На главную
        </button>
      </div>
    );
  }

  const d = payload.diagnosis;
  const img = payload.problem?.imageUrl;

  return (
    <div className="min-h-[100dvh] bg-[var(--tg-theme-bg-color,#fff)] p-4 pb-10">
      {img && <img src={img} alt="задача" className="mb-4 max-h-48 w-full rounded-xl object-contain" />}
      <div className="mb-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">Оценка</p>
        <p className="text-3xl font-bold">{d.overallScore}</p>
        <p className="text-sm text-amber-600">+{d.coinsEarned} EGC</p>
      </div>
      <h3 className="mb-2 font-semibold">Шаги</h3>
      <ul className="space-y-2">
        {(Array.isArray(d.steps) ? d.steps : []).map((s, i) => (
          <li key={i} className="rounded-lg border border-zinc-200 p-3 text-sm">
            <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(s, null, 2)}</pre>
          </li>
        ))}
      </ul>
      <h3 className="mb-2 mt-6 font-semibold">Рекомендации</h3>
      <ul className="space-y-2 text-sm text-zinc-700">
        {(Array.isArray(d.recommendations) ? d.recommendations : []).map((r, i) => (
          <li key={i}>{JSON.stringify(r)}</li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm" onClick={() => navigate("/camera")}>
          Похожая
        </button>
        <button type="button" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm" onClick={() => navigate("/")}>
          Главная
        </button>
      </div>
    </div>
  );
}
