import type { RequestHandler } from "express";
import { Router } from "express";
import { processTelegramPaymentUpdate } from "../services/telegramPaymentsService";
import { asyncHandler } from "../utils/asyncHandler";

const verifyTelegramWebhook: RequestHandler = (req, res, next) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ ok: false });
    return;
  }
  if (req.header("X-Telegram-Bot-Api-Secret-Token") !== secret) {
    res.status(401).json({ ok: false });
    return;
  }
  next();
};

export const telegramWebhookRouter = Router();

telegramWebhookRouter.post(
  "/",
  verifyTelegramWebhook,
  asyncHandler(async (req, res) => {
    await processTelegramPaymentUpdate(req.body as Parameters<typeof processTelegramPaymentUpdate>[0]);
    res.json({ ok: true });
  }),
);
