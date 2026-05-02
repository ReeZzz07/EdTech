import { prisma } from "../database/client";
import { DEFAULT_SUBJECTS } from "../data/defaultSubjects";
import { logger } from "../utils/logger";

/** Если таблица Subject пустая или не хватает кодов из дефолта — upsert (идемпотентно). */
export async function ensureDefaultSubjects(): Promise<void> {
  for (const s of DEFAULT_SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, isEnabled: true, sortOrder: s.sortOrder, skillMap: structuredClone(s.skillMap) as object },
      create: {
        code: s.code,
        name: s.name,
        isEnabled: true,
        sortOrder: s.sortOrder,
        skillMap: structuredClone(s.skillMap) as object,
      },
    });
  }
  logger.info("Subject bootstrap: default catalog OK");
}
