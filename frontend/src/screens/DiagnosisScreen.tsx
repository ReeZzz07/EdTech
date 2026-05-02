import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PeerHelpPanel } from "../components/social/PeerHelpPanel";
import { api } from "../services/api";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";

type StatusRes = { status: string };
type DiagnosisRes = {
  status: string;
  diagnosis: null | {
    overallScore: number;
    coinsEarned: number;
    steps: unknown;
    recommendations: unknown;
    errors: unknown;
  };
  problem?: {
    id?: string;
    subjectId?: string;
    imageUrl: string;
    originalText?: string | null;
    studentSolution?: string | null;
    bankTaskId?: string | null;
    subject?: { name: string; code: string };
  };
};

function isStepRecord(s: unknown): s is { description?: string; stepNumber?: number; feedback?: string; isCorrect?: boolean } {
  return typeof s === "object" && s !== null;
}

function isRecRecord(r: unknown): r is { title?: string; action?: string } {
  return typeof r === "object" && r !== null;
}

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
        if (data.diagnosis && data.problem?.subjectId) {
          capture("problem_solved", {
            problemId,
            subjectId: data.problem.subjectId,
            score: data.diagnosis.overallScore,
          });
          capture("coins_earned", {
            problemId,
            amount: data.diagnosis.coinsEarned,
            source: "diagnosis",
          });
        }
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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-tg-bg p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-tg-link border-t-transparent" />
        <p className="text-center text-tg-hint">ИИ анализирует решение…</p>
      </div>
    );
  }

  if (phase === "error" || !payload?.diagnosis) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-red-600">Не удалось завершить анализ</p>
        <button
          type="button"
          className="rounded-xl bg-tg-link px-6 py-3 text-[var(--tg-theme-button-text-color,#fff)]"
          onClick={() => navigate("/")}
        >
          На главную
        </button>
      </div>
    );
  }

  const d = payload.diagnosis;
  const img = payload.problem?.imageUrl;
  const isBank = Boolean(img?.startsWith("bank:") || payload.problem?.bankTaskId);
  const stepsArr = Array.isArray(d.steps) ? d.steps : [];
  const recArr = Array.isArray(d.recommendations) ? d.recommendations : [];
  const errArr = Array.isArray(d.errors) ? d.errors : [];

  return (
    <div className="min-h-[100dvh] bg-tg-bg p-4 pb-10 text-tg-text">
      {isBank ? (
        <div className="mb-4 space-y-3">
          {payload.problem?.originalText ? (
            <div className="rounded-2xl border border-tg bg-tg-secondary p-4">
              <p className="text-xs font-medium text-tg-hint">Условие (банк)</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{payload.problem.originalText}</p>
            </div>
          ) : null}
          {payload.problem?.studentSolution ? (
            <div className="rounded-2xl border border-tg bg-tg-secondary p-4">
              <p className="text-xs font-medium text-tg-hint">Твой ответ</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{payload.problem.studentSolution}</p>
            </div>
          ) : null}
        </div>
      ) : img ? (
        <img src={img} alt="задача" className="mb-4 max-h-48 w-full rounded-xl object-contain" />
      ) : null}
      <div className="mb-4 rounded-2xl border border-tg bg-tg-secondary p-4 shadow-sm">
        <p className="text-sm text-tg-hint">{payload.problem?.subject?.name ?? "Разбор"}</p>
        <p className="text-sm text-tg-hint">Оценка</p>
        <p className="text-3xl font-bold text-tg-text">{d.overallScore}</p>
        <p className="text-sm text-amber-600">+{d.coinsEarned} EGC</p>
      </div>

      {errArr.length > 0 && (
        <>
          <h3 className="mb-2 font-semibold text-tg-text">Замечания</h3>
          <ul className="mb-6 space-y-2">
            {errArr.map((raw, i) => (
              <li key={i} className="rounded-lg border border-amber-500/35 bg-amber-500/12 p-3 text-sm text-tg-text">
                {typeof raw === "string" ? raw : JSON.stringify(raw)}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="mb-2 font-semibold text-tg-text">Шаги</h3>
      <ul className="space-y-2">
        {stepsArr.map((raw, i) => (
          <li key={i} className="rounded-lg border border-tg bg-tg-secondary p-3 text-sm">
            {isStepRecord(raw) ? (
              <>
                <p className="font-medium">
                  Шаг {raw.stepNumber ?? i + 1}
                  {typeof raw.isCorrect === "boolean" ? (
                    <span className={raw.isCorrect ? " text-emerald-600" : " text-red-600"}>
                      {" "}
                      · {raw.isCorrect ? "верно" : "есть ошибки"}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-tg-text">{raw.description ?? "—"}</p>
                {raw.feedback ? <p className="mt-1 text-xs text-tg-hint">{raw.feedback}</p> : null}
              </>
            ) : (
              <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(raw, null, 2)}</pre>
            )}
          </li>
        ))}
      </ul>

      <h3 className="mb-2 mt-6 font-semibold text-tg-text">Рекомендации</h3>
      <ul className="space-y-2 text-sm">
        {recArr.map((raw, i) => (
          <li key={i} className="rounded-lg border border-tg-link/30 bg-tg-secondary p-3 text-tg-text">
            {isRecRecord(raw) ? (
              <>
                <p className="font-medium">{raw.title ?? "Шаг"}</p>
                {raw.action ? <p className="mt-1 text-xs text-tg-hint">{raw.action}</p> : null}
              </>
            ) : typeof raw === "string" ? (
              raw
            ) : (
              JSON.stringify(raw)
            )}
          </li>
        ))}
      </ul>

      {problemId && payload.problem?.subjectId ? (
        <PeerHelpPanel subjectId={payload.problem.subjectId} problemId={problemId} />
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" className="rounded-xl border border-tg px-4 py-2 text-sm text-tg-text" onClick={() => navigate(isBank ? "/tasks" : "/camera")}>
          {isBank ? "Ещё из банка" : "Похожая"}
        </button>
        <button type="button" className="rounded-xl border border-tg px-4 py-2 text-sm text-tg-text" onClick={() => navigate("/")}>
          Главная
        </button>
      </div>
    </div>
  );
}
