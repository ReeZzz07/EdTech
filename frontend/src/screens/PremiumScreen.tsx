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
    <div className="p-4 pb-24 text-tg-text">
      <button type="button" className="mb-4 text-sm text-tg-link" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <h1 className="mb-2 text-xl font-bold">Premium</h1>
      {!offer ? (
        <p className="mb-2 text-xs text-tg-hint">Загрузка тарифа…</p>
      ) : (
        <p className="mb-2 text-sm text-tg-hint">
          Тариф: <strong className="text-tg-text">{offer.priceRub} ₽</strong> за <strong className="text-tg-text">{offer.days}</strong> дн.
          {!offer.invoiceAvailable ? (
            <span className="mt-1 block text-amber-600">
              На сервере не настроен платёжный провайдер — см. TELEGRAM_PAYMENT_PROVIDER_TOKEN.
            </span>
          ) : null}
        </p>
      )}
      {active ? (
        <p className="mb-4 rounded-xl border border-emerald-500/35 bg-emerald-500/12 p-3 text-sm text-tg-text">
          У тебя активен Premium
          {user?.premiumUntil ? ` до ${new Date(user.premiumUntil).toLocaleString("ru-RU")}` : ""}.
        </p>
      ) : (
        <p className="mb-4 text-sm text-tg-hint">
          Оплата через официальные Telegram Payments (провайдер из BotFather). После оплаты подписка продлевается автоматически.
        </p>
      )}

      {err ? (
        <p className="mb-3 rounded-lg border border-red-500/35 bg-red-500/12 p-2 text-sm text-red-800">{err}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-tg bg-tg-secondary">
        <table className="w-full text-left text-sm">
          <thead className="bg-tg-hint/15">
            <tr>
              <th className="px-3 py-2 text-tg-text">Функция</th>
              <th className="px-3 py-2 text-tg-text">Free</th>
              <th className="px-3 py-2 text-tg-text">Premium</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature} className="border-t border-tg">
                <td className="px-3 py-2 text-tg-text">{row.feature}</td>
                <td className="px-3 py-2 text-tg-hint">{row.free}</td>
                <td className="px-3 py-2 font-medium text-tg-link">{row.prem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-tg-text">
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
          className="mt-8 w-full rounded-xl bg-tg-link py-4 text-center text-sm font-semibold text-[var(--tg-theme-button-text-color,#fff)] disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => void payPremium()}
        >
          {busy ? "Открываем оплату…" : `Оплатить в Telegram${offer ? ` · ${offer.priceRub} ₽` : ""}`}
        </button>
      ) : null}

      {!active && import.meta.env.VITE_DEV_JWT?.trim() ? (
        <p className="mt-2 text-center text-xs text-amber-700">В dev JWT режиме счёт недоступен — войди через Telegram.</p>
      ) : null}

      {!active && offer?.invoiceAvailable && !canPayInTelegram ? (
        <p className="mt-2 text-center text-xs text-tg-hint">Кнопка активна только внутри Telegram Mini App.</p>
      ) : null}

      {!active ? (
        <button type="button" className="mt-6 w-full text-sm text-tg-link" onClick={() => navigate("/shop")}>
          Альтернатива: Premium за ЕГЭCOIN в магазине
        </button>
      ) : null}
    </div>
  );
}
