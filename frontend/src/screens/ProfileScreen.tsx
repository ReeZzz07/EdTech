import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { ACHIEVEMENT_DEFS } from "../constants/achievements";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";
import { api } from "../services/api";

type AchievementRow = { code: string; unlockedAt: string };

export function ProfileScreen() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);

  useEffect(() => {
    capture("screen_view", { screen: "profile" });
  }, []);

  useEffect(() => {
    void api.get<{ items: AchievementRow[] }>("/api/user/achievements").then((r) => setAchievements(r.data.items));
  }, []);

  const unlocked = new Map(achievements.map((a) => [a.code, a.unlockedAt]));

  const premiumUntil =
    user?.premiumUntil &&
    new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(user.premiumUntil));

  return (
    <div className="p-4 pb-28">
      <h1 className="mb-4 text-xl font-bold">Профиль</h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-800">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (user?.firstName?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{user?.firstName ?? "—"}</p>
          {user?.username ? <p className="text-sm text-zinc-500">@{user.username}</p> : null}
          <p className="text-sm text-zinc-500">Уровень {user?.level ?? 1}</p>
          {user?.isPremium ? (
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-700">
              <Crown size={16} /> Premium
              {premiumUntil ? <span className="font-normal text-zinc-500">до {premiumUntil}</span> : null}
            </p>
          ) : (
            <button type="button" className="mt-1 text-sm text-blue-600" onClick={() => navigate("/premium")}>
              Подключить Premium
            </button>
          )}
        </div>
      </div>

      <section className="mb-6 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-zinc-500">EGC</p>
          <p className="font-semibold">{user?.coinBalance ?? 0}</p>
        </div>
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-zinc-500">Задачи</p>
          <p className="font-semibold">{user?.totalProblemsSolved ?? 0}</p>
        </div>
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-zinc-500">Серия</p>
          <p className="font-semibold">{user?.dailyStreak ?? 0}</p>
        </div>
      </section>

      <h2 className="mb-2 text-sm font-semibold text-zinc-600">Достижения</h2>
      <ul className="mb-6 space-y-2">
        {ACHIEVEMENT_DEFS.map((def) => {
          const at = unlocked.get(def.code);
          return (
            <li
              key={def.code}
              className={`rounded-xl border p-4 ${at ? "border-amber-200 bg-amber-50/80 dark:bg-amber-950/25" : "border-black/10 opacity-70"}`}
            >
              <p className="font-medium">{def.title}</p>
              <p className="text-sm text-zinc-600">{def.description}</p>
              {at ? <p className="mt-1 text-xs text-zinc-400">Открыто {new Date(at).toLocaleDateString("ru-RU")}</p> : null}
            </li>
          );
        })}
      </ul>

      <ul className="space-y-2">
        <li>
          <button type="button" className="w-full rounded-xl border border-black/10 bg-white p-4 text-left" onClick={() => navigate("/shop")}>
            Магазин ЕГЭCOIN
          </button>
        </li>
        <li>
          <button type="button" className="w-full rounded-xl border border-black/10 bg-white p-4 text-left" onClick={() => navigate("/premium")}>
            Premium
          </button>
        </li>
        <li>
          <button
            type="button"
            className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-left text-red-800"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Выйти (dev)
          </button>
        </li>
      </ul>
    </div>
  );
}
