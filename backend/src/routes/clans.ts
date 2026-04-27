import { Router } from "express";
import { z } from "zod";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import {
  clanLeaderboard,
  createClan,
  getMyClan,
  joinClan,
  leaveClan,
  listClansForUser,
} from "../services/clanService";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

export const clansRouter = Router();

clansRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = z.object({ q: z.string().optional() }).parse(req.query);
    const list = await listClansForUser(req.authUserId!, q.q ?? "");
    res.json({
      items: list.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isPublic: c.isPublic,
        maxMembers: c.maxMembers,
        members: c._count.members,
        createdAt: c.createdAt,
      })),
    });
  }),
);

clansRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const m = await getMyClan(req.authUserId!);
    if (!m) {
      res.json({ clan: null });
      return;
    }
    res.json({
      clan: {
        id: m.clan.id,
        name: m.clan.name,
        description: m.clan.description,
        isPublic: m.clan.isPublic,
        maxMembers: m.clan.maxMembers,
        role: m.role,
      },
    });
  }),
);

clansRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const b = z
      .object({ name: z.string().min(1).max(80), description: z.string().max(2000).optional() })
      .parse(req.body);
    const c = await createClan(req.authUserId!, b.name, b.description ?? "—");
    res.json({ id: c.id, name: c.name });
  }),
);

clansRouter.post(
  "/:id/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    const c = await joinClan(req.authUserId!, req.params.id);
    res.json({ id: c.id, ok: true });
  }),
);

clansRouter.delete(
  "/:id/leave",
  requireAuth,
  asyncHandler(async (req, res) => {
    await leaveClan(req.authUserId!, req.params.id);
    res.json({ ok: true });
  }),
);

clansRouter.get(
  "/:id/leaderboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    const clan = await prisma.clan.findUnique({ where: { id: req.params.id } });
    if (!clan) {
      throw new HttpError("not found", 404, "not_found");
    }
    const member = await prisma.clanMember.findFirst({ where: { userId: req.authUserId!, clanId: req.params.id } });
    if (!member) {
      throw new HttpError("Нет доступа к клану", 403, "forbidden");
    }
    const rows = await clanLeaderboard(req.params.id);
    res.json({ items: rows });
  }),
);
