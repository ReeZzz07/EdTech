import type { Prisma } from "@prisma/client";
import { prisma } from "../database/client";
import { gamificationConfig } from "../config/gamification";
import { enqueueTelegramNotification } from "../jobs/queues";
import { utcDayKey } from "../utils/dayKey";
import { logger } from "../utils/logger";

const ACH = {
  FIRST: "first_solution",
  STREAK7: "streak_7",
  HUNDRED: "hundred_problems",
} as const;

const ACH_TITLES: Record<string, string> = {
  [ACH.FIRST]: "Первое решение",
  [ACH.STREAK7]: "Неделя подряд",
  [ACH.HUNDRED]: "Сто задач",
};

type PendingTelegram = { telegramId: string; text: string };

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function yesterdayYmd() {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() - 1);
  return ymd(t);
}

/**
 * Начисление XP/уровня, streak, achievements после успешного диагноза
 */
export async function onProblemDiagnosed(input: { userId: string; problemId: string; overallScore: number }) {
  const pendingTelegram: PendingTelegram[] = [];
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: input.userId } });
    if (!u) return;
    const dayKey = utcDayKey();
    const prevDaily = await tx.dailySolve.findUnique({
      where: { userId_dayKey: { userId: input.userId, dayKey } },
    });
    const was = prevDaily?.solveCount ?? 0;
    const isFirstToday = was === 0;
    await tx.dailySolve.upsert({
      where: { userId_dayKey: { userId: input.userId, dayKey } },
      create: { userId: input.userId, dayKey, solveCount: 1, coinsFromSolves: 0 },
      update: { solveCount: { increment: 1 } },
    });
    const xpGain =
      gamificationConfig.xpPerSolve + (input.overallScore >= 70 ? gamificationConfig.xpCorrectBonus : 0);
    const exp2 = u.experience + xpGain;
    const level = 1 + Math.floor(exp2 / gamificationConfig.xpPerLevel);
    const todayD = ymd(new Date());
    const lastD = ymd(u.lastActiveDate);
    const yD = yesterdayYmd();

    let newStreak = u.dailyStreak;
    if (isFirstToday) {
      if (lastD === yD) {
        newStreak = u.dailyStreak + 1;
      } else if (lastD === todayD) {
        newStreak = u.dailyStreak;
      } else {
        newStreak = 1;
      }
    }

    const totalSolved = u.totalProblemsSolved + 1;
    await tx.user.update({
      where: { id: u.id },
      data: {
        experience: exp2,
        level,
        totalProblemsSolved: totalSolved,
        dailyStreak: newStreak,
        lastActiveDate: new Date(),
      },
    });

    if (u.totalProblemsSolved === 0) {
      await unlock(tx, input.userId, ACH.FIRST, 200, pendingTelegram);
    }
    if (newStreak >= 7) {
      await unlock(tx, input.userId, ACH.STREAK7, 200, pendingTelegram);
    }
    if (totalSolved >= 100) {
      await unlock(tx, input.userId, ACH.HUNDRED, 200, pendingTelegram);
    }
  });
  for (const n of pendingTelegram) {
    void enqueueTelegramNotification(n.telegramId, n.text);
  }
}

async function unlock(
  tx: Prisma.TransactionClient,
  userId: string,
  code: string,
  bonus: number,
  pendingTelegram: PendingTelegram[],
) {
  const existing = await tx.userAchievement.findUnique({ where: { userId_code: { userId, code } } });
  if (existing) return;
  await tx.userAchievement.create({ data: { userId, code } });
  try {
    await tx.coinTransaction.create({
      data: { userId, amount: bonus, type: "achievement", refId: `ach:${code}` },
    });
    await tx.user.update({ where: { id: userId }, data: { coinBalance: { increment: bonus } } });
  } catch (e) {
    logger.error({ e, userId, code }, "achievement coin grant failed");
  }

  const u = await tx.user.findUnique({ where: { id: userId }, select: { telegramId: true } });
  if (!u) return;
  const title = ACH_TITLES[code] ?? code;
  pendingTelegram.push({
    telegramId: u.telegramId.toString(),
    text: `Новое достижение: «${title}». Начислено +${bonus} EGC.`,
  });
}
