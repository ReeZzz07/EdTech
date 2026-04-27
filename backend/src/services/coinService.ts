import { prisma } from "../database/client";
import { gamificationConfig } from "../config/gamification";
import { utcDayKey } from "../utils/dayKey";
import { HttpError } from "../utils/httpError";

const TYPE_DIAGNOSIS = "diagnosis_earn";
const IDEMPOTENCY_KEY = (problemId: string) => `earn:${TYPE_DIAGNOSIS}:${problemId}`;

/**
 * Начисление за завершение диагноза: идемпотентно по (user, type, refId=problemId), дневной кап 500.
 */
export async function tryEarnForDiagnosis(userId: string, problemId: string, rawAmount: number) {
  if (rawAmount === 0) return { amount: 0, capped: 0, skipped: "zero" as const };
  if (rawAmount < 0) return { amount: 0, capped: 0, skipped: "negative" as const };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.coinTransaction.findFirst({
      where: { userId, type: TYPE_DIAGNOSIS, refId: problemId },
    });
    if (existing) {
      return { amount: 0, capped: 0, skipped: "duplicate" as const };
    }

    const dayKey = utcDayKey();
    const daily = await tx.dailySolve.upsert({
      where: { userId_dayKey: { userId, dayKey } },
      create: { userId, dayKey, solveCount: 0, coinsFromSolves: 0 },
      update: {},
    });
    const capLeft = Math.max(0, gamificationConfig.dailyCoinCap - daily.coinsFromSolves);
    const add = Math.min(rawAmount, capLeft);

    if (add <= 0) {
      return { amount: 0, capped: rawAmount, skipped: "coin_cap" as const };
    }

    await tx.coinTransaction.create({
      data: { userId, amount: add, type: TYPE_DIAGNOSIS, refId: problemId, meta: { idempotency: IDEMPOTENCY_KEY(problemId) } },
    });
    await tx.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: add } },
    });
    await tx.dailySolve.update({
      where: { id: daily.id },
      data: { coinsFromSolves: { increment: add } },
    });
    return { amount: add, capped: rawAmount - add, skipped: "ok" as const };
  });
}

export async function spend(userId: string, amount: number, type: string, meta?: object) {
  if (amount <= 0) throw new HttpError("amount>0", 400, "invalid_amount");
  return prisma.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: userId } });
    if (!u) throw new HttpError("not found", 404);
    if (u.coinBalance < amount) {
      throw new HttpError("Недостаточно ЕГЭCOIN", 402, "insufficient_coins");
    }
    const t = await tx.coinTransaction.create({
      data: { userId, amount: -amount, type, meta: meta as object | undefined, refId: `spend-${Date.now()}` },
    });
    await tx.user.update({
      where: { id: userId },
      data: { coinBalance: { decrement: amount } },
    });
    return t;
  });
}

export async function listTransactions(userId: string, take = 50) {
  return prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 200),
  });
}
