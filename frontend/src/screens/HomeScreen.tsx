import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useSubjectStore } from "../stores/subjectStore";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";

export function HomeScreen() {
  const { user } = useUserStore();
  const { items, selectedId, load, select } = useSubjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    capture("screen_view", { screen: "home" });
  }, []);

  const subj = items.find((s) => s.id === selectedId);

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Баланс</p>
          <p className="text-2xl font-bold text-amber-600">{user?.coinBalance ?? 0} EGC</p>
        </div>
        <button type="button" className="rounded-full p-2 opacity-60" aria-label="Уведомления">
          <Bell size={22} />
        </button>
      </header>

      <section className="mb-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm dark:bg-zinc-800/80">
        <p className="text-sm font-medium text-zinc-600">Текущий предмет</p>
        <select
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-transparent p-2 text-base"
          value={selectedId ?? ""}
          onChange={(e) => select(e.target.value || null)}
        >
          {items.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-zinc-400">{subj?.code}</p>
      </section>

      <section className="mb-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
        <p className="text-sm font-semibold">Твой прогресс</p>
        <p className="mt-1 text-sm text-zinc-600">
          Уровень {user?.level ?? 1} · решено задач {user?.totalProblemsSolved ?? 0} · серия {user?.dailyStreak ?? 0} дн.
        </p>
      </section>

      <section className="rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 p-4 dark:bg-blue-950/20">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Рекомендации ИИ</p>
        <p className="mt-1 text-sm text-zinc-600">После первого разбора здесь появятся персональные темы.</p>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white"
          onClick={() => navigate("/camera")}
        >
          Сфотографировать задачу
        </button>
      </section>
    </div>
  );
}
