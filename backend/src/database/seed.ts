import "dotenv/config";
import { logger } from "../utils/logger";
import { prisma } from "./client";

const subjects = [
  { code: "math", name: "Математика", sortOrder: 1 },
  { code: "russian", name: "Русский язык", sortOrder: 2 },
] as const;

async function main() {
  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, isEnabled: true, sortOrder: s.sortOrder },
      create: {
        code: s.code,
        name: s.name,
        isEnabled: true,
        sortOrder: s.sortOrder,
      },
    });
  }
}

main()
  .then(() => {
    logger.info("Seed: subjects OK");
  })
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
