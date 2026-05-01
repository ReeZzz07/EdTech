import { prisma } from "../database/client";
import { HttpError } from "../utils/httpError";

const TYPE_ESCROW = "peer_help_escrow";
const TYPE_REFUND = "peer_help_refund";
const TYPE_REWARD = "peer_help_reward";

const MIN_REWARD = 10;
const MAX_REWARD = 500;

function rewardRef(requestId: string) {
  return `peer_reward:${requestId}`;
}

function escrowRef(requestId: string) {
  return `peer_escrow:${requestId}`;
}

export async function createRequest(
  authorId: string,
  input: { subjectId: string; problemId?: string | null; body: string; rewardCoins: number },
) {
  const { subjectId, problemId, body, rewardCoins } = input;
  if (body.trim().length < 5) {
    throw new HttpError("Описание слишком короткое", 400, "bad_body");
  }
  if (rewardCoins < MIN_REWARD || rewardCoins > MAX_REWARD) {
    throw new HttpError(`Награда ${MIN_REWARD}–${MAX_REWARD} EGC`, 400, "bad_reward");
  }

  if (problemId) {
    const p = await prisma.problem.findFirst({
      where: { id: problemId, userId: authorId },
      select: { id: true, subjectId: true },
    });
    if (!p) {
      throw new HttpError("Задача не найдена", 404, "problem_not_found");
    }
    if (p.subjectId !== subjectId) {
      throw new HttpError("Предмет не совпадает с задачей", 400, "subject_mismatch");
    }
  }

  const sub = await prisma.subject.findFirst({ where: { id: subjectId, isEnabled: true } });
  if (!sub) {
    throw new HttpError("Предмет не найден", 404, "subject_not_found");
  }

  return prisma.$transaction(async (tx) => {
    const req = await tx.peerHelpRequest.create({
      data: {
        authorId,
        subjectId,
        problemId: problemId ?? null,
        body: body.trim(),
        rewardCoins,
        status: "open",
      },
    });

    const u = await tx.user.findUnique({ where: { id: authorId } });
    if (!u) throw new HttpError("not found", 404);
    if (u.coinBalance < rewardCoins) {
      await tx.peerHelpRequest.delete({ where: { id: req.id } });
      throw new HttpError("Недостаточно ЕГЭCOIN", 402, "insufficient_coins");
    }

    await tx.coinTransaction.create({
      data: {
        userId: authorId,
        amount: -rewardCoins,
        type: TYPE_ESCROW,
        refId: escrowRef(req.id),
        meta: { peerHelpRequestId: req.id },
      },
    });
    await tx.user.update({
      where: { id: authorId },
      data: { coinBalance: { decrement: rewardCoins } },
    });

    return req;
  });
}

export async function listOpen(subjectId: string | undefined, take: number) {
  return prisma.peerHelpRequest.findMany({
    where: {
      status: "open",
      ...(subjectId ? { subjectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 50),
    include: {
      author: { select: { id: true, firstName: true, username: true } },
      subject: { select: { code: true, name: true } },
    },
  });
}

export async function listMine(userId: string) {
  return prisma.peerHelpRequest.findMany({
    where: { OR: [{ authorId: userId }, { helperId: userId }] },
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: {
      author: { select: { id: true, firstName: true } },
      helper: { select: { id: true, firstName: true } },
      subject: { select: { code: true, name: true } },
    },
  });
}

export async function claim(requestId: string, helperId: string) {
  const r = await prisma.peerHelpRequest.findUnique({ where: { id: requestId } });
  if (!r || r.status !== "open") {
    throw new HttpError("Запрос недоступен", 409, "not_open");
  }
  if (r.authorId === helperId) {
    throw new HttpError("Нельзя взять свой запрос", 400, "self_help");
  }

  const updated = await prisma.peerHelpRequest.updateMany({
    where: { id: requestId, status: "open" },
    data: { status: "claimed", helperId },
  });
  if (updated.count === 0) {
    throw new HttpError("Уже взято", 409, "race");
  }
  return prisma.peerHelpRequest.findUnique({ where: { id: requestId } });
}

export async function complete(requestId: string, helperId: string, response: string) {
  const text = response.trim();
  if (text.length < 10) {
    throw new HttpError("Ответ слишком короткий", 400, "bad_response");
  }

  return prisma.$transaction(async (tx) => {
    const r = await tx.peerHelpRequest.findUnique({ where: { id: requestId } });
    if (!r || r.helperId !== helperId || r.status !== "claimed") {
      throw new HttpError("Нет прав или неверный статус", 403, "forbidden");
    }

    const existing = await tx.coinTransaction.findFirst({
      where: { userId: helperId, type: TYPE_REWARD, refId: rewardRef(requestId) },
    });
    if (existing) {
      throw new HttpError("Уже выполнено", 409, "duplicate");
    }

    await tx.peerHelpRequest.update({
      where: { id: requestId },
      data: { status: "done", response: text },
    });

    await tx.coinTransaction.create({
      data: {
        userId: helperId,
        amount: r.rewardCoins,
        type: TYPE_REWARD,
        refId: rewardRef(requestId),
        meta: { peerHelpRequestId: requestId },
      },
    });
    await tx.user.update({
      where: { id: helperId },
      data: { coinBalance: { increment: r.rewardCoins } },
    });

    return tx.peerHelpRequest.findUnique({ where: { id: requestId } });
  });
}

export async function cancel(requestId: string, authorId: string) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.peerHelpRequest.findUnique({ where: { id: requestId } });
    if (!r || r.authorId !== authorId) {
      throw new HttpError("Нет доступа", 403, "forbidden");
    }
    if (r.status !== "open") {
      throw new HttpError("Можно отменить только открытый запрос", 409, "not_cancellable");
    }

    await tx.peerHelpRequest.update({
      where: { id: requestId },
      data: { status: "cancelled" },
    });

    const refundRef = `peer_refund:${requestId}`;
    await tx.coinTransaction.create({
      data: {
        userId: authorId,
        amount: r.rewardCoins,
        type: TYPE_REFUND,
        refId: refundRef,
        meta: { peerHelpRequestId: requestId },
      },
    });
    await tx.user.update({
      where: { id: authorId },
      data: { coinBalance: { increment: r.rewardCoins } },
    });

    return r;
  });
}
