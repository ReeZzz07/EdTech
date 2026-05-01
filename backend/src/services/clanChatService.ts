import { prisma } from "../database/client";
import { HttpError } from "../utils/httpError";

export async function assertClanMember(userId: string, clanId: string) {
  const m = await prisma.clanMember.findFirst({ where: { userId, clanId } });
  if (!m) throw new HttpError("Нет доступа к клану", 403, "forbidden");
}

export async function listClanMessages(clanId: string, take = 80) {
  return prisma.clanMessage.findMany({
    where: { clanId },
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 200),
    include: { user: { select: { id: true, firstName: true } } },
  });
}

export async function postClanMessage(userId: string, clanId: string, body: string) {
  await assertClanMember(userId, clanId);
  const text = body.trim().slice(0, 2000);
  if (!text) throw new HttpError("Пустое сообщение", 400, "empty_body");
  return prisma.clanMessage.create({
    data: { clanId, userId, body: text },
    include: { user: { select: { id: true, firstName: true } } },
  });
}
