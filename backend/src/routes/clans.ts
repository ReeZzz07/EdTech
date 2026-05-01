import { Router } from "express";
import { z } from "zod";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import { listClanMessages, postClanMessage } from "../services/clanChatService";
import {
  clanLeaderboard,
  createClan,
  getMyClan,
  globalClanLeaderboard,
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
  "/leaderboard/global",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const items = await globalClanLeaderboard(25);
    res.json({ items });
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
  "/:id/messages",
  requireAuth,
  asyncHandler(async (req, res) => {
    const member = await prisma.clanMember.findFirst({ where: { userId: req.authUserId!, clanId: req.params.id } });
    if (!member) {
      throw new HttpError("Нет доступа к клану", 403, "forbidden");
    }
    const rows = await listClanMessages(req.params.id);
    res.json({
      items: rows.reverse().map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        user: m.user,
      })),
    });
  }),
);

clansRouter.post(
  "/:id/messages",
  requireAuth,
  asyncHandler(async (req, res) => {
    const b = z.object({ body: z.string().min(1).max(2000) }).parse(req.body);
    const msg = await postClanMessage(req.authUserId!, req.params.id, b.body);
    res.json({
      message: {
        id: msg.id,
        body: msg.body,
        createdAt: msg.createdAt,
        user: msg.user,
      },
    });
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
