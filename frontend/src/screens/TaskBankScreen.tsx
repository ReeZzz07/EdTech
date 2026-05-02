import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { api } from "../services/api";
import { capture } from "../services/analytics";
import { useSubjectStore } from "../stores/subjectStore";

type Row = {
  id: string;
  title: string;
  difficulty: number;
  topicTag: string;
  subjectId: string;
  subject?: { name: string; code: string };
};

export function TaskBankScreen() {
  const navigate = useNavigate();
  const { items, selectedId, load, select } = useSubjectStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    capture("screen_view", { screen: "task_bank" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = selectedId ? `?subjectId=${encodeURIComponent(selectedId)}` : "";
    void api
      .get<{ items: Row[] }>(`/api/bank-tasks${q}`)
      .then((r) => {
        if (!cancelled) {
          setRows(r.data.items);
          setErr(null);
        }
      })
      .catch(() => {
        if (!cancelled) setErr("Не удалось загрузить задания");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div className="p-4 pb-28">
      <header className="mb-4">
        <p className="text-xs text-tg-hint">Каталог</p>
        <h1 className="text-xl font-bold text-tg-text">Банк заданий</h1>
        <p className="mt-1 text-sm text-tg-hint">
          Выбери предмет и открой задачу — ответ текстом, без фото. Разбор как после снимка.
        </p>
      </header>

      <section className="mb-4 rounded-2xl border border-tg bg-tg-secondary p-4 shadow-sm">
        <p className="text-sm font-medium text-tg-hint">Предмет</p>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-tg-hint">Загрузка списка предметов…</p>
        ) : (
          <select
            className="mt-2 w-full rounded-lg border border-tg bg-tg-bg p-2 text-base text-tg-text"
            value={selectedId ?? ""}
            onChange={(e) => select(e.target.value || null)}
          >
            <option value="">Все предметы</option>
            {items.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </section>

      {err ? (
        <p className="mb-4 text-sm text-red-600">{err}</p>
      ) : null}

      <ul className="space-y-2">
        {rows.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-tg bg-tg-secondary p-4 text-left shadow-sm active:scale-[0.99]"
              onClick={() => navigate(`/tasks/${encodeURIComponent(t.id)}`)}
            >
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-tg-text">{t.title}</p>
                <p className="mt-0.5 text-xs text-tg-hint">
                  {t.subject?.name ?? "Предмет"} · сложность {t.difficulty}
                  {t.topicTag ? ` · ${t.topicTag}` : ""}
                </p>
              </div>
              <ChevronRight className="shrink-0 text-tg-hint" size={20} />
            </button>
          </li>
        ))}
      </ul>

      {rows.length === 0 && !err ? (
        <p className="mt-6 text-center text-sm text-tg-hint">
          {selectedId ? "Нет опубликованных заданий для этого предмета." : "Нет заданий в банке."}
        </p>
      ) : null}
    </div>
  );
}
