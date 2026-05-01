import { prisma } from "../database/client";
import { telegramConfig } from "../config/telegram";
import { paymentsConfig } from "../config/payments";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";
import { userHasActivePremium } from "./premiumService";

type TelegramOk<T> = { ok: boolean; result?: T; description?: string };

async function botApi<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const token = telegramConfig.botToken;
  if (!token) throw new HttpError("Telegram bot не сконфигурирован", 503, "config");
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = (await r.json()) as TelegramOk<T>;
  if (!j.ok) {
    logger.warn({ method, description: j.description }, "telegram bot api");
    throw new HttpError(j.description ?? "Ошибка Telegram API", 502, "telegram_api");
  }
  return j.result as T;
}

/** Сумма в копейках (минимальная единица RUB для Bot API). */
function premiumAmountMinor(totalRub: number) {
  return Math.round(totalRub * 100);
}

/** Публичные параметры оффера (без секретов). */
export function getPremiumOfferPublicInfo() {
  return {
    priceRub: paymentsConfig.premiumPriceRub,
    days: paymentsConfig.premiumDays,
    invoiceAvailable: Boolean(paymentsConfig.providerToken && telegramConfig.botToken),
  };
}

export async function createPremiumMonthInvoiceLink(userId: string): Promise<string> {
  const pt = paymentsConfig.providerToken;
  if (!pt) {
    throw new HttpError("Оплата временно недоступна", 503, "payments_disabled");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError("not found", 404, "not_found");

  const rub = paymentsConfig.premiumPriceRub;
  const totalMinor = premiumAmountMinor(rub);

  const intent = await prisma.paymentIntent.create({
    data: {
      userId,
      kind: "premium_month",
      status: "pending",
      currency: "RUB",
      totalAmountMinor: totalMinor,
    },
  });

  return botApi<string>("createInvoiceLink", {
    title: "ЕГЭ PRO Premium",
    description: `Подписка ${paymentsConfig.premiumDays} дн. · ${rub} ₽`,
    payload: intent.id,
    provider_token: pt,
    currency: "RUB",
    prices: [{ label: `Premium ${paymentsConfig.premiumDays} дн.`, amount: totalMinor }],
  });
}

type PreCheckoutQuery = {
  id: string;
  from: { id: number };
  invoice_payload: string;
  currency: string;
  total_amount: number;
};

type SuccessfulPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id?: string;
};

export async function processTelegramPaymentUpdate(update: {
  pre_checkout_query?: PreCheckoutQuery;
  message?: { from?: { id: number }; successful_payment?: SuccessfulPayment };
}) {
  if (update.pre_checkout_query) {
    await handlePreCheckout(update.pre_checkout_query);
    return;
  }
  const msg = update.message;
  const sp = msg?.successful_payment;
  const fromId = msg?.from?.id;
  if (sp && typeof fromId === "number") {
    await handleSuccessfulPayment(fromId, sp);
  }
}

async function handlePreCheckout(q: PreCheckoutQuery) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: q.invoice_payload },
    include: { user: true },
  });

  let ok = false;
  let error_message = "Не удалось подтвердить счёт";

  try {
    if (!intent || intent.status !== "pending") throw new Error("intent");
    if (intent.currency !== q.currency) throw new Error("currency");
    if (intent.totalAmountMinor !== q.total_amount) throw new Error("amount");
    if (intent.user.telegramId !== BigInt(q.from.id)) throw new Error("user");
    ok = true;
  } catch {
    ok = false;
    error_message = "Счёт недействителен";
  }

  await botApi<boolean>("answerPreCheckoutQuery", {
    pre_checkout_query_id: q.id,
    ok,
    ...(ok ? {} : { error_message }),
  });
}

async function handleSuccessfulPayment(fromTelegramId: number, sp: SuccessfulPayment) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: sp.invoice_payload },
    include: { user: true },
  });
  if (!intent) return;
  if (intent.user.telegramId !== BigInt(fromTelegramId)) return;

  await prisma.$transaction(async (tx) => {
    const row = await tx.paymentIntent.findUnique({ where: { id: intent.id } });
    if (!row || row.status !== "pending") return;

    const user = await tx.user.findUnique({ where: { id: intent.userId } });
    if (!user) return;

    const days = paymentsConfig.premiumDays;
    const now = new Date();
    const active = userHasActivePremium(user);
    const startFrom =
      active && user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
    const newUntil = new Date(startFrom);
    newUntil.setUTCDate(newUntil.getUTCDate() + days);

    await tx.user.update({
      where: { id: user.id },
      data: { isPremium: true, premiumUntil: newUntil },
    });
    await tx.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        telegramPaymentChargeId: sp.telegram_payment_charge_id,
        providerPaymentChargeId: sp.provider_payment_charge_id ?? null,
      },
    });
  });
}
