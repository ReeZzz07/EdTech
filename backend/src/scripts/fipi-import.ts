/**
 * Импорт справочника тем ФИПИ из backend/data/fipi/<code>.json в Subject.fipiSpecKey + Subject.fipiTopics.
 * Запуск: npm run fipi:import -w backend (из корня монорепо).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/client";
import { logger } from "../utils/logger";

type FipiFile = {
  fipiSpecKey: string;
  topics: unknown;
};

async function main() {
  const dir = path.join(process.cwd(), "data", "fipi");
  if (!fs.existsSync(dir)) {
    logger.error(`Нет каталога ${dir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    logger.warn("Нет JSON в data/fipi");
    return;
  }

  for (const file of files) {
    const code = path.basename(file, ".json");
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const data = JSON.parse(raw) as FipiFile;
    if (!data.fipiSpecKey || data.topics == null) {
      logger.error(`Пропуск ${file}: нужны fipiSpecKey и topics`);
      continue;
    }

    const sub = await prisma.subject.findUnique({ where: { code } });
    if (!sub) {
      logger.warn(`Предмет с code="${code}" не найден — добавьте в seed или создайте вручную`);
      continue;
    }

    await prisma.subject.update({
      where: { id: sub.id },
      data: {
        fipiSpecKey: data.fipiSpecKey,
        fipiTopics: data.topics as object,
      },
    });
    logger.info(`OK ${code} → fipiSpecKey=${data.fipiSpecKey}`);
  }
}

main()
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
