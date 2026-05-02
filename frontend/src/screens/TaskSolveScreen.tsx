import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { capture } from "../services/analytics";
import { getApiErrorMeta } from "../utils/apiError";

type TaskDto = {
  id: string;
  title: string;
  body: string;
  difficulty: number;
  topicTag: string;
  subjectId: string;
  subject?: { name: string; code: string };
};

export function TaskSolveScreen() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDto | null>(null);
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    capture("screen_view", { screen: "task_solve", taskId });
    let cancelled = false;
    void api
      .get<{ task: TaskDto }>(`/api/bank-tasks/${encodeURIComponent(taskId)}`)
      .then((r) => {
        if (!cancelled) {
          setTask(r.data.task);
          setErr(null);
        }
      })
      .catch(() => {
        if (!cancelled) setErr("Задание не найдено");
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function submit() {
    if (!taskId || !answer.trim()) {
      setErr("Введите ответ");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { data } = await api.post<{ problemId: string }>(
        `/api/bank-tasks/${encodeURIComponent(taskId)}/submit`,
        { answerText: answer.trim() },
      );
      navigate(`/diagnosis/${encodeURIComponent(data.problemId)}`);
    } catch (e: unknown) {
      const m = getApiErrorMeta(e);
      setErr(m.message ?? "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  }

  if (!taskId) return null;

  if (err && !task) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-red-600">{err}</p>
        <button type="button" className="rounded-xl bg-tg-link px-6 py-3 text-[var(--tg-theme-button-text-color,#fff)]" onClick={() => navigate("/tasks")}>
          К списку
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-tg-bg p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-tg-link border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-tg-bg p-4 pb-28 text-tg-text">
      <button type="button" className="mb-4 text-sm text-tg-link" onClick={() => navigate("/tasks")}>
        ← К банку
      </button>
      <p className="text-xs text-tg-hint">{task.subject?.name ?? "Задание"}</p>
      <h1 className="mt-1 text-xl font-bold">{task.title}</h1>
      {task.topicTag ? <p className="mt-1 text-sm text-tg-hint">{task.topicTag}</p> : null}

      <div className="mt-4 rounded-2xl border border-tg bg-tg-secondary p-4 shadow-sm">
        <p className="text-sm font-medium text-tg-hint">Условие</p>
        <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{task.body}</p>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-medium text-tg-hint">Твой ответ</span>
        <textarea
          className="mt-2 min-h-[140px] w-full rounded-xl border border-tg bg-tg-bg p-3 text-base text-tg-text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Решение или ответ текстом…"
          aria-label="Ответ на задание"
        />
      </label>

      {err && task ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

      <button
        type="button"
        disabled={busy}
        className="mt-6 w-full rounded-xl bg-tg-link py-3 text-sm font-medium text-[var(--tg-theme-button-text-color,#fff)] disabled:opacity-50"
        onClick={() => void submit()}
      >
        {busy ? "Отправка…" : "Проверить разбором ИИ"}
      </button>
    </div>
  );
}
