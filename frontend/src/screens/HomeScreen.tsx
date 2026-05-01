import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import { ACHIEVEMENT_DEFS } from "../constants/achievements";
import { useSubjectStore } from "../stores/subjectStore";
import { useUserStore } from "../stores/userStore";
import { api } from "../services/api";
import { capture } from "../services/analytics";
import { xpInCurrentLevel } from "../utils/gamification";

type AchievementRow = { code: string; unlockedAt: string };

export function HomeScreen() {
  const { user, refreshMe } = useUserStore();
  const { items, selectedId, load, select } = useSubjectStore();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    capture("screen_view", { screen: "home" });
  }, []);

  useEffect(() => {
    void api.get<{ items: AchievementRow[] }>("/api/user/achievements").then((r) => setAchievements(r.data.items));
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const subj = items.find((s) => s.id === selectedId);

  const xpPerLevel = user?.xpPerLevel ?? 1000;
  const { pct: xpPct } = xpInCurrentLevel(user?.experience ?? 0, xpPerLevel);

  const limitLine = useMemo(() => {
    if (user?.isPremium || user?.dailySolveLimit == null) {
      return "Premium: разборов без дневного лимита";
    }
    const lim = user.dailySolveLimit;
    const used = user.attemptsToday ?? 0;
    const left = Math.max(0, lim - used);
    return `${left} из ${lim} попыток сегодня`;
  }, [user]);

  const unlockedCodes = new Set(achievements.map((a) => a.code));

  return (
    <div className="p-4 pb-28">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Баланс</p>
          <button type="button" className="text-left" onClick={() => navigate("/shop")}>
            <p className="text-2xl font-bold text-amber-600">{user?.coinBalance ?? 0} EGC</p>
            <p className="text-xs text-blue-600">В магазин →</p>
          </button>
        </div>
        <button type="button" className="rounded-full p-2 opacity-60" aria-label="Уведомления">
          <Bell size={22} />
        </button>
      </header>

      <section className="mb-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm dark:bg-zinc-800/80">
        <p className="text-sm font-medium text-zinc-600">Сегодня</p>
        <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{limitLine}</p>
        {(user?.dailySolveLimit != null &&
          !user?.isPremium &&
          (user.attemptsToday ?? 0) >= (user.dailySolveLimit ?? 0)) ? (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Лимит на сегодня исчерпан.
            <button type="button" className="ml-2 font-medium underline" onClick={() => navigate("/premium")}>
              Premium
            </button>
          </div>
        ) : null}
      </section>

      <section className="mb-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Уровень и XP</p>
          <button type="button" className="text-xs text-blue-600" onClick={() => navigate("/progress")}>
            Прогресс <ChevronRight className="inline" size={14} />
          </button>
        </div>
        <p className="mt-1 text-lg font-bold">
          Ур. {user?.level ?? 1}{" "}
          <span className="text-sm font-normal text-zinc-500">
            · {user?.experience ?? 0} XP · серия {user?.dailyStreak ?? 0} дн.
          </span>
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${xpPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">До следующего уровня по шкале XP (локально от остатка).</p>
      </section>

      <section className="mb-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm dark:bg-zinc-800/80">
        <p className="text-sm font-medium text-zinc-600">Текущий предмет</p>
        <select
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-transparent p-2 text-base dark:border-zinc-600"
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
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Достижения</p>
          <button type="button" className="text-xs text-blue-600" onClick={() => navigate("/profile")}>
            Все →
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {ACHIEVEMENT_DEFS.map((def) => {
            const ok = unlockedCodes.has(def.code);
            return (
              <div
                key={def.code}
                className={`min-w-[104px] rounded-xl border p-3 text-center text-xs ${
                  ok ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "border-zinc-200 opacity-60 dark:border-zinc-700"
                }`}
              >
                <p className="font-semibold leading-tight">{def.title}</p>
                <p className="mt-1 text-[10px] text-zinc-500">{ok ? "Открыто" : "Закрыто"}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 p-4 dark:bg-blue-950/20">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Рекомендации ИИ</p>
        <p className="mt-1 text-sm text-zinc-600">
          После разборов здесь можно смотреть прогресс по темам на вкладке «Прогресс». Решено задач всего:{" "}
          <strong>{user?.totalProblemsSolved ?? 0}</strong>.
        </p>
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
