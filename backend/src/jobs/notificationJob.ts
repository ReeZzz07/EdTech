import { notificationQ } from "./queues";
import { sendTelegramMessage } from "../services/notificationService";
import { logger } from "../utils/logger";

let started = false;

export function startNotificationWorker() {
  if (started) return;
  if (process.env.DISABLE_BULL === "1") {
    logger.debug("notification worker skipped: DISABLE_BULL=1");
    return;
  }
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    logger.debug("notification worker skipped: no TELEGRAM_BOT_TOKEN");
    return;
  }
  started = true;
  const concurrency = 4;
  void notificationQ.process(concurrency, async (job) => {
    const { telegramId, text } = job.data;
    await sendTelegramMessage(telegramId, text);
    logger.debug({ telegramId }, "telegram notification sent");
  });
}
