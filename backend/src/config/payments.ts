/** Telegram Payments (Mini Apps): провайдер из BotFather + секрет webhook. */
export const paymentsConfig = {
  providerToken: process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN?.trim(),
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim(),
  premiumPriceRub: Math.max(1, Number(process.env.PREMIUM_PRICE_RUB ?? "399")),
  premiumDays: Math.max(1, Number(process.env.PREMIUM_DURATION_DAYS ?? "30")),
} as const;
