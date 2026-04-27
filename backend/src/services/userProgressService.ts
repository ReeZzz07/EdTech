import type { Prisma } from "@prisma/client";
import { prisma } from "../database/client";
import { HttpError } from "../utils/httpError";

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function getUserProgress(userId: string, subjectId: string | undefined, period: "week" | "month" | "all") {
  const now = new Date();
  const start =
    period === "all"
      ? new Date(0)
      : period === "month"
        ? addDays(now, -30)
        : addDays(now, -7);
  const whereBase: Prisma.ProblemWhereInput = {
    userId,
    status: "completed",
    createdAt: { gte: start },
  };
  if (subjectId) whereBase.subjectId = subjectId;
  const problems = await prisma.problem.findMany({
    where: whereBase,
    select: { id: true, createdAt: true, subjectId: true },
  });
  // Группировка по дням UTC
  const byDay: Record<string, number> = {};
  for (const p of problems) {
    const k = p.createdAt.toISOString().slice(0, 10);
    byDay[k] = (byDay[k] ?? 0) + 1;
  }
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) throw new HttpError("not found", 404);
  return {
    period,
    subjectId: subjectId ?? null,
    solvedByDay: Object.entries(byDay)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    totals: { solved: problems.length, streak: u.dailyStreak, level: u.level, experience: u.experience },
  };
}
