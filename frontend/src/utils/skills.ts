/** Подпись навыка из `subject.skillMap` (массив `{ skillId, label }`). */
export function skillLabelFromSubjectMap(skillMap: unknown, skillId: string): string {
  if (!Array.isArray(skillMap)) return skillId;
  for (const row of skillMap) {
    if (row && typeof row === "object" && "skillId" in row && (row as { skillId: string }).skillId === skillId) {
      const label = (row as { label?: string }).label;
      return typeof label === "string" && label.trim() ? label : skillId;
    }
  }
  return skillId;
}
