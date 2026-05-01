/** Совпадает с кодами на бэке (`gamificationService`). */
export const ACHIEVEMENT_DEFS = [
  {
    code: "first_solution",
    title: "Первое решение",
    description: "Завершите первый разбор задачи",
  },
  {
    code: "streak_7",
    title: "Неделя подряд",
    description: "7 дней активности с разборами",
  },
  {
    code: "hundred_problems",
    title: "Сто задач",
    description: "100 завершённых разборов",
  },
] as const;
