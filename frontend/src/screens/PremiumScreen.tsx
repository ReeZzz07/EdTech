import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";

const ROWS = [
  { feature: "Разборов в день", free: "3", prem: "Без лимита" },
  { feature: "Диагностика", free: "базовая", prem: "расширенная" },
  { feature: "Приоритет очереди ИИ", free: "—", prem: "да" },
  { feature: "Темы оформления", free: "стандарт", prem: "все" },
] as const;

export function PremiumScreen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    capture("screen_view", { screen: "premium" });
  }, []);

  const active = Boolean(user?.isPremium);

  return (
    <div className="p-4 pb-24">
      <button type="button" className="mb-4 text-sm text-blue-600" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <h1 className="mb-2 text-xl font-bold">Premium</h1>
      {active ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          У тебя активен Premium
          {user?.premiumUntil ? ` до ${new Date(user.premiumUntil).toLocaleString("ru-RU")}` : ""}.
        </p>
      ) : (
        <p className="mb-4 text-sm text-zinc-600">
          Сними дневной лимит разборов и открой расширенные возможности. Оплата через Telegram Payments подключается на этапе продакт-релиза.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Функция</th>
              <th className="px-3 py-2">Free</th>
              <th className="px-3 py-2">Premium</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature} className="border-t border-black/10">
                <td className="px-3 py-2">{row.feature}</td>
                <td className="px-3 py-2 text-zinc-600">{row.free}</td>
                <td className="px-3 py-2 font-medium text-blue-700 dark:text-blue-300">{row.prem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-zinc-700">
        <li className="flex gap-2">
          <Check className="mt-0.5 shrink-0 text-emerald-600" size={18} /> Больше практики без остановок на лимите
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 shrink-0 text-emerald-600" size={18} /> Спокойная подготовка в пик сезона
        </li>
      </ul>

      <button
        type="button"
        disabled
        className="mt-8 w-full rounded-xl bg-zinc-300 py-4 text-center text-sm font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
      >
        Оплатить через Telegram (скоро)
      </button>
      <p className="mt-2 text-center text-xs text-zinc-500">Пока можно выдать Premium в БД / через внутренние сценарии.</p>

      {!active ? (
        <button type="button" className="mt-4 w-full text-sm text-blue-600" onClick={() => navigate("/shop")}>
          Купить упрощённый Premium за EGC в магазине
        </button>
      ) : null}
    </div>
  );
}
