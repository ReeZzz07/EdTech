/** Прогресс XP внутри текущего уровня (уровень приходит с сервера). */
export function xpInCurrentLevel(experience: number, xpPerLevel: number) {
  if (!xpPerLevel || xpPerLevel <= 0) return { current: 0, pct: 0 };
  const current = experience % xpPerLevel;
  const pct = Math.round((current / xpPerLevel) * 100);
  return { current, pct };
}
