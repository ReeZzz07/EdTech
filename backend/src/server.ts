import "dotenv/config";
import { initBackendSentry } from "./instrument";
import { app } from "./app";
import { databaseConfig, yandexGptConfig } from "./config";
import { startDiagnosisWorker } from "./jobs/diagnosisJob";
import { startNotificationWorker } from "./jobs/notificationJob";
import { ensureDefaultSubjects } from "./services/subjectBootstrap";
import { logger } from "./utils/logger";

initBackendSentry();

if (!databaseConfig.url) {
  logger.warn("DATABASE_URL не задан — Prisma/миграции не сработают");
}
if (!yandexGptConfig.folderId && !yandexGptConfig.apiKey) {
  logger.debug("Yandex Cloud credentials не заданы (нормально на этапе 1)");
}

if (process.env.DISABLE_BULL !== "1") {
  startDiagnosisWorker();
  startNotificationWorker();
}

const port = Number(process.env.PORT) || 3000;

async function start() {
  if (databaseConfig.url) {
    try {
      await ensureDefaultSubjects();
    } catch (e) {
      logger.error(e, "ensureDefaultSubjects failed — проверьте миграции и DATABASE_URL");
    }
  }
  app.listen(port, () => {
    logger.info({ port, env: process.env.NODE_ENV ?? "development" }, "HTTP server started");
  });
}

void start();
