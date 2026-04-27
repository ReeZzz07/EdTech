import { prisma } from "../database/client";
import { HttpError } from "../utils/httpError";

export async function listClansForUser(_userId: string, q: string) {
  return prisma.clan.findMany({
    where: {
      isPublic: true,
      ...(q.trim() ? { name: { contains: q.trim(), mode: "insensitive" as const } } : {}),
    },
    take: 30,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });
}

export async function getMyClan(userId: string) {
  return prisma.clanMember.findFirst({ where: { userId }, include: { clan: true } });
}

export async function createClan(userId: string, name: string, description: string) {
  const has = await prisma.clanMember.findFirst({ where: { userId } });
  if (has) {
    throw new HttpError("Уже в клане. Сначала выйди.", 400, "already_in_clan");
  }
  return prisma.$transaction(async (tx) => {
    const c = await tx.clan.create({
      data: {
        name: name.slice(0, 80),
        description: description.slice(0, 2000) || "—",
        ownerId: userId,
        isPublic: true,
        maxMembers: 30,
      },
    });
    await tx.clanMember.create({ data: { clanId: c.id, userId, role: "owner" } });
    return c;
  });
}

export async function joinClan(userId: string, clanId: string) {
  const existing = await prisma.clanMember.findFirst({ where: { userId } });
  if (existing) {
    throw new HttpError("Уже в клане", 400, "already_in_clan");
  }
  const c = await prisma.clan.findUnique({ where: { id: clanId }, include: { _count: { select: { members: true } } } });
  if (!c) throw new HttpError("not found", 404);
  if (c._count.members >= c.maxMembers) {
    throw new HttpError("Клан полон", 400, "clan_full");
  }
  await prisma.clanMember.create({ data: { clanId, userId } });
  return c;
}

export async function leaveClan(userId: string, clanId: string) {
  const m = await prisma.clanMember.findFirst({ where: { userId, clanId } });
  if (!m) return;
  const c = await prisma.clan.findUnique({ where: { id: clanId } });
  if (m.role === "owner" && c?.ownerId === userId) {
    const cnt = await prisma.clanMember.count({ where: { clanId } });
    if (cnt <= 1) {
      await prisma.clanMember.delete({ where: { id: m.id } });
      await prisma.clan.delete({ where: { id: clanId } });
      return;
    }
    throw new HttpError("Передай владение или дождись, пока в клане >1 (MVP).", 400, "owner_leave");
  }
  await prisma.clanMember.delete({ where: { id: m.id } });
}

export async function clanLeaderboard(clanId: string) {
  const m = await prisma.clanMember.findMany({
    where: { clanId },
    include: { user: { select: { id: true, firstName: true, totalProblemsSolved: true, dailyStreak: true, coinBalance: true } } },
  });
  return m
    .map((x) => ({ user: x.user, role: x.role, joinedAt: x.joinedAt }))
    .sort((a, b) => b.user.totalProblemsSolved - a.user.totalProblemsSolved);
}
