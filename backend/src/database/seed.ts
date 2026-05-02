import "dotenv/config";
import { DEFAULT_SUBJECTS } from "../data/defaultSubjects";
import { logger } from "../utils/logger";
import { prisma } from "./client";

async function main() {
  for (const s of DEFAULT_SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, isEnabled: true, sortOrder: s.sortOrder, skillMap: s.skillMap },
      create: {
        code: s.code,
        name: s.name,
        isEnabled: true,
        sortOrder: s.sortOrder,
        skillMap: s.skillMap,
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
