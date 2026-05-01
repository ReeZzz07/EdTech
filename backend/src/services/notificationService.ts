import { logger } from "../utils/logger";

/** Отправка сообщения пользователю в Telegram (chat_id = telegram numeric id). */
export async function sendTelegramMessage(telegramId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    logger.debug({ telegramId }, "Telegram notify skipped: TELEGRAM_BOT_TOKEN unset");
    return { ok: false as const, reason: "no_token" };
  }
  const body = {
    chat_id: telegramId,
    text: text.slice(0, 4096),
    disable_web_page_preview: true,
  };
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await r.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!r.ok || json.ok === false) {
    logger.warn({ telegramId, status: r.status, json }, "telegram sendMessage failed");
    throw new Error(json.description ?? `telegram_http_${r.status}`);
  }
  return { ok: true as const };
}
