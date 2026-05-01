import { Router } from "express";
import { z } from "zod";
import { claim, cancel, complete, createRequest, listMine, listOpen } from "../services/peerHelpService";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const peerHelpRouter = Router();

peerHelpRouter.use(requireAuth);

peerHelpRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const b = z
      .object({
        subjectId: z.string().min(1),
        problemId: z.string().min(1).optional().nullable(),
        body: z.string().min(5).max(2000),
        rewardCoins: z.number().int().min(10).max(500),
      })
      .parse(req.body);
    const row = await createRequest(req.authUserId!, {
      subjectId: b.subjectId,
      problemId: b.problemId ?? undefined,
      body: b.body,
      rewardCoins: b.rewardCoins,
    });
    const balance = (await prisma.user.findUnique({ where: { id: req.authUserId! }, select: { coinBalance: true } }))
      ?.coinBalance;
    res.status(201).json({ item: row, balanceAfter: balance });
  }),
);

peerHelpRouter.get(
  "/open",
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        subjectId: z.string().optional(),
        take: z.coerce.number().int().min(1).max(50).optional(),
      })
      .parse(req.query);
    const items = await listOpen(q.subjectId, q.take ?? 30);
    res.json({ items });
  }),
);

peerHelpRouter.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const items = await listMine(req.authUserId!);
    res.json({ items });
  }),
);

peerHelpRouter.post(
  "/:id/claim",
  asyncHandler(async (req, res) => {
    const id = z.string().min(1).parse(req.params.id);
    const row = await claim(id, req.authUserId!);
    res.json({ item: row });
  }),
);

peerHelpRouter.post(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    const id = z.string().min(1).parse(req.params.id);
    const b = z.object({ response: z.string().min(10).max(8000) }).parse(req.body);
    const row = await complete(id, req.authUserId!, b.response);
    const balance = (await prisma.user.findUnique({ where: { id: req.authUserId! }, select: { coinBalance: true } }))
      ?.coinBalance;
    res.json({ item: row, balanceAfter: balance });
  }),
);

peerHelpRouter.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const id = z.string().min(1).parse(req.params.id);
    await cancel(id, req.authUserId!);
    const balance = (await prisma.user.findUnique({ where: { id: req.authUserId! }, select: { coinBalance: true } }))
      ?.coinBalance;
    res.json({ ok: true, balanceAfter: balance });
  }),
);
