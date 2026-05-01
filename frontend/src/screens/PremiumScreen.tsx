import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { api } from "../services/api";
import { capture } from "../services/analytics";
import { openTelegramInvoice } from "../services/telegram";
import { useUserStore } from "../stores/userStore";
import { getApiErrorMeta } from "../utils/apiError";

const ROWS = [
  { feature: "Разборов в день", free: "3", prem: "Без лимита" },
  { feature: "Диагностика", free: "базовая", prem: "расширенная" },
  { feature: "Приоритет очереди ИИ", free: "—", prem: "да" },
  { feature: "Темы оформления", free: "стандарт", prem: "все" },
] as const;

type OfferInfo = { priceRub: number; days: number; invoiceAvailable: boolean };

export function PremiumScreen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const refreshMe = useUserStore((s) => s.refreshMe);
  const [offer, setOffer] = useState<OfferInfo | undefined>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    capture("screen_view", { screen: "premium" });
  }, []);

  useEffect(() => {
    void api.get<OfferInfo>("/api/payments/premium/info").then((r) => setOffer(r.data));
  }, []);

  const active = Boolean(user?.isPremium);
  const canPayInTelegram =
    typeof window !== "undefined" && typeof window.Telegram?.WebApp?.openInvoice === "function";

  async function payPremium() {
    setErr(null);
    setBusy(true);
    capture("premium_checkout_started");
    try {
      const { data } = await api.post<{ invoiceLink: string }>("/api/payments/premium/invoice");
      const status = await openTelegramInvoice(data.invoiceLink);
      capture("premium_checkout_closed", { status });
      if (status === "paid") await refreshMe();
      else if (status === "cancelled") setErr("Оплата отменена");
      else if (status === "failed") setErr("Оплата не прошла");
      else if (status === "unsupported") setErr("Открой приложение из Telegram Mini App");
    } catch (e) {
      setErr(getApiErrorMeta(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 pb-24">
      <button type="button" className="mb-4 text-sm text-blue-600" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <h1 className="mb-2 text-xl font-bold">Premium</h1>
      {!offer ? (
        <p className="mb-2 text-xs text-zinc-500">Загрузка тарифа…</p>
      ) : (
        <p className="mb-2 text-sm text-zinc-600">
          Тариф: <strong>{offer.priceRub} ₽</strong> за <strong>{offer.days}</strong> дн.
          {!offer.invoiceAvailable ? (
            <span className="block pt-1 text-amber-700 dark:text-amber-400">
              На сервере не настроен платёжный провайдер — см. TELEGRAM_PAYMENT_PROVIDER_TOKEN.
            </span>
          ) : null}
        </p>
      )}
      {active ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          У тебя активен Premium
          {user?.premiumUntil ? ` до ${new Date(user.premiumUntil).toLocaleString("ru-RU")}` : ""}.
        </p>
      ) : (
        <p className="mb-4 text-sm text-zinc-600">
          Оплата через официальные Telegram Payments (провайдер из BotFather). После оплаты подписка продлевается автоматически.
        </p>
      )}

      {err ? <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p> : null}

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

      {!active ? (
        <button
          type="button"
          disabled={
            busy ||
            !offer ||
            !offer.invoiceAvailable ||
            !canPayInTelegram ||
            Boolean(import.meta.env.VITE_DEV_JWT?.trim())
          }
          className="mt-8 w-full rounded-xl bg-blue-600 py-4 text-center text-sm font-semibold text-white disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
          onClick={() => void payPremium()}
        >
          {busy ? "Открываем оплату…" : `Оплатить в Telegram${offer ? ` · ${offer.priceRub} ₽` : ""}`}
        </button>
      ) : null}

      {!active && import.meta.env.VITE_DEV_JWT?.trim() ? (
        <p className="mt-2 text-center text-xs text-amber-700">В dev JWT режиме счёт недоступен — войди через Telegram.</p>
      ) : null}

      {!active && offer?.invoiceAvailable && !canPayInTelegram ? (
        <p className="mt-2 text-center text-xs text-zinc-500">Кнопка активна только внутри Telegram Mini App.</p>
      ) : null}

      {!active ? (
        <button type="button" className="mt-6 w-full text-sm text-blue-600" onClick={() => navigate("/shop")}>
          Альтернатива: Premium за ЕГЭCOIN в магазине
        </button>
      ) : null}
    </div>
  );
}
