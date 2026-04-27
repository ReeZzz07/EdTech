import { Router } from "express";
import { z } from "zod";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import { listTransactions, spend } from "../services/coinService";
import { getShopItem, listShopItems } from "../services/shopService";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

export const coinsRouter = Router();

coinsRouter.get(
  "/balance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.authUserId! } });
    if (!u) {
      throw new HttpError("not found", 404);
    }
    res.json({ balance: u.coinBalance });
  }),
);

coinsRouter.get(
  "/transactions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const n = z.object({ take: z.coerce.number().int().min(1).max(200).optional() }).parse(req.query);
    const items = await listTransactions(req.authUserId!, n.take ?? 50);
    res.json({ items });
  }),
);

coinsRouter.post(
  "/spend",
  requireAuth,
  asyncHandler(async (req, res) => {
    const b = z.object({ itemId: z.string().min(1) }).parse(req.body);
    const item = getShopItem(b.itemId);
    const t = await spend(req.authUserId!, item.price, `shop_${b.itemId}`, { item: b.itemId, label: item.label });
    res.json({ ok: true, transaction: t, balanceAfter: (await prisma.user.findUnique({ where: { id: req.authUserId! } }))?.coinBalance });
  }),
);

coinsRouter.get(
  "/shop",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({ items: listShopItems() });
  }),
);

const earnSchema = z.object({
  amount: z.number().int().positive(),
  type: z.string().min(1),
  refId: z.string().min(1),
});

/** Внутренняя интеграция / тест: требуется `X-Internal-Key` */
coinsRouter.post(
  "/earn",
  requireAuth,
  asyncHandler(async (req, res) => {
    const key = process.env.INTERNAL_COIN_EARN_KEY;
    if (!key || req.header("X-Internal-Key") !== key) {
      throw new HttpError("forbidden", 403, "forbidden");
    }
    const b = earnSchema.parse(req.body);
    const existing = await prisma.coinTransaction.findFirst({
      where: { userId: req.authUserId!, type: b.type, refId: b.refId },
    });
    if (existing) {
      res.json({ ok: true, duplicate: true, transaction: existing });
      return;
    }
    const t = await prisma.$transaction(async (tx) => {
      const c = await tx.coinTransaction.create({
        data: { userId: req.authUserId!, amount: b.amount, type: b.type, refId: b.refId },
      });
      await tx.user.update({ where: { id: req.authUserId! }, data: { coinBalance: { increment: b.amount } } });
      return c;
    });
    res.json({ ok: true, transaction: t });
  }),
);
