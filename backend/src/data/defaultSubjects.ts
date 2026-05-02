/** Каталог предметов по умолчанию — общий для seed и автозаполнения при старте API. */
export const DEFAULT_SUBJECTS = [
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
  {
    code: "physics",
    name: "Физика",
    sortOrder: 3,
    skillMap: [
      { skillId: "physics.mechanics", label: "Механика" },
      { skillId: "physics.molecular", label: "Молекулярная физика" },
      { skillId: "physics.electricity", label: "Электричество и магнетизм" },
    ],
  },
] as const;
