import "dotenv/config";
import { logger } from "../utils/logger";
import { prisma } from "./client";

const subjects = [
  {
    code: "math",
    name: "Математика",
    sortOrder: 1,
    skillMap: [
      { skillId: "math.algebra", label: "Алгебра" },
      { skillId: "math.geometry", label: "Геометрия" },
      { skillId: "math.analysis", label: "Матанализ" },
    ],
  },
  {
    code: "russian",
    name: "Русский язык",
    sortOrder: 2,
    skillMap: [
      { skillId: "russian.ortho", label: "Орфография" },
      { skillId: "russian.punctuation", label: "Пунктуация" },
      { skillId: "russian.syntax", label: "Синтаксис" },
    ],
  },
] as const;

async function main() {
  for (const s of subjects) {
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
