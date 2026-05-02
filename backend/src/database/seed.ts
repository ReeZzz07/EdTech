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

  const math = await prisma.subject.findUnique({ where: { code: "math" } });
  const rus = await prisma.subject.findUnique({ where: { code: "russian" } });
  const phy = await prisma.subject.findUnique({ where: { code: "physics" } });

  const bankSeeds: Array<{
    id: string;
    subjectId: string;
    title: string;
    body: string;
    difficulty: number;
    topicTag: string;
    sortOrder: number;
  }> = [];

  if (math) {
    bankSeeds.push(
      {
        id: "bank_seed_math_lin",
        subjectId: math.id,
        title: "Линейное уравнение",
        body: "Решите уравнение: 3(x − 2) = 2x + 7. Запишите значение x.",
        difficulty: 2,
        topicTag: "Линейные уравнения",
        sortOrder: 1,
      },
      {
        id: "bank_seed_math_quad",
        subjectId: math.id,
        title: "Квадратное уравнение",
        body: "Найдите действительные корни уравнения x² − 5x + 6 = 0 (если есть).",
        difficulty: 3,
        topicTag: "Квадратные уравнения",
        sortOrder: 2,
      },
    );
  }
  if (rus) {
    bankSeeds.push(
      {
        id: "bank_seed_ru_syn",
        subjectId: rus.id,
        title: "Синтаксический разбор",
        body: 'Дайте синтаксический разбор предложения: «Звёзды ярко светят в тёмном небе». Укажите главные члены.',
        difficulty: 3,
        topicTag: "Синтаксис",
        sortOrder: 1,
      },
      {
        id: "bank_seed_ru_spell",
        subjectId: rus.id,
        title: "Орфография",
        body: "Вставьте пропущенные буквы в словах: ш_п_жник, к_рт_на, с_бака.",
        difficulty: 2,
        topicTag: "Орфография",
        sortOrder: 2,
      },
    );
  }
  if (phy) {
    bankSeeds.push(
      {
        id: "bank_seed_phy_speed",
        subjectId: phy.id,
        title: "Равномерное движение",
        body: "Тело за 4 с прошло путь 20 м равномерно. Найдите скорость в м/с и запишите ответ числом.",
        difficulty: 2,
        topicTag: "Кинематика",
        sortOrder: 1,
      },
      {
        id: "bank_seed_phy_ohm",
        subjectId: phy.id,
        title: "Закон Ома",
        body: "Напряжение на резисторе 12 В, сила тока 2 А. Чему равно сопротивление? Ответ в омах.",
        difficulty: 2,
        topicTag: "Электричество",
        sortOrder: 2,
      },
    );
  }

  for (const t of bankSeeds) {
    await prisma.bankTask.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        subjectId: t.subjectId,
        title: t.title,
        body: t.body,
        difficulty: t.difficulty,
        topicTag: t.topicTag,
        sortOrder: t.sortOrder,
        isPublished: true,
      },
      update: {
        title: t.title,
        body: t.body,
        difficulty: t.difficulty,
        topicTag: t.topicTag,
        sortOrder: t.sortOrder,
        isPublished: true,
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
