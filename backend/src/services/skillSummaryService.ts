import { prisma } from "../database/client";
import type { SkillAssessmentAI } from "../types/diagnosisAI";

export async function getSkillSummaryForUser(userId: string, subjectId: string) {
  const diagnoses = await prisma.diagnosis.findMany({
    where: {
      problem: { userId, subjectId, status: "completed" },
    },
    select: { skillAssessment: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const agg = new Map<string, { sum: number; n: number }>();
  for (const d of diagnoses) {
    const arr = d.skillAssessment as unknown;
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const sk = item as SkillAssessmentAI;
      if (!sk?.skillId || typeof sk.score !== "number") continue;
      const cur = agg.get(sk.skillId) ?? { sum: 0, n: 0 };
      cur.sum += sk.score;
      cur.n += 1;
      agg.set(sk.skillId, cur);
    }
  }

  return Array.from(agg.entries())
    .map(([skillId, v]) => ({
      skillId,
      avgScore: Math.round(v.sum / v.n),
      samples: v.n,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}
