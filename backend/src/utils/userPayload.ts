import type { User } from "@prisma/client";
import { prisma } from "../database/client";
import { gamificationConfig } from "../config/gamification";
import { startOfUtcDay } from "./dateUtc";
import { userToJson } from "./userDto";

/** Полезная нагрузка пользователя для клиента: профиль + дневной лимит разборов. */
export async function userPayloadWithUsage(user: User) {
  const start = startOfUtcDay(new Date());
  const attemptsToday = await prisma.problem.count({
    where: { userId: user.id, createdAt: { gte: start } },
  });
  const dailySolveLimit = user.isPremium ? null : gamificationConfig.freeDailySolveLimit;
  return {
    ...userToJson(user),
    attemptsToday,
    dailySolveLimit,
    xpPerLevel: gamificationConfig.xpPerLevel,
  };
}
