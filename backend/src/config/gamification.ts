/** Лимит решений в день: Free / Premium+ (см. ТЗ). Freemium 15 — вынести в поле `tier` при интеграции оплаты. */
export const gamificationConfig = {
  freeDailySolveLimit: 3,
  freemiumDailySolveLimit: 15,
  dailyCoinCap: 500,
  xpPerSolve: 50,
  xpCorrectBonus: 25,
  xpPerLevel: 1000,
  defaultStartingCoins: 500,
} as const;
