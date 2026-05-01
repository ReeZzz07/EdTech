import { prisma } from "../database/client";
import { gamificationConfig } from "../config/gamification";
import { userHasActivePremium } from "./premiumService";
import { startOfUtcDay } from "../utils/dateUtc";
import { HttpError } from "../utils/httpError";

function dailyLimitForUser(isPremiumActive: boolean) {
  if (isPremiumActive) return Number.POSITIVE_INFINITY;
  return gamificationConfig.freeDailySolveLimit;
}

/**
 * Считает «попытки сегодня»: записанные `Problem` с датой >= начало дня по UTC
 */
export async function assertCanCreateProblem(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) throw new HttpError("User not found", 404, "not_found");
  const limit = dailyLimitForUser(userHasActivePremium(u));
  if (!Number.isFinite(limit)) return;
  const start = startOfUtcDay(new Date());
  const n = await prisma.problem.count({
    where: {
      userId,
      createdAt: { gte: start },
    },
  });
  if (n >= limit) {
    throw new HttpError("Дневной лимит попыток исчерпан. Premium — безлимит.", 429, "daily_limit");
  }
}
