import { Router } from "express";
import { z } from "zod";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import { getUserProgress } from "../services/userProgressService";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";
import { getSkillSummaryForUser } from "../services/skillSummaryService";
import { userToJson } from "../utils/userDto";

export const userRouter = Router();

userRouter.get(
  "/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        subjectId: z.string().optional(),
        period: z.enum(["week", "month", "all"]).optional(),
      })
      .parse(req.query);
    const p = await getUserProgress(req.authUserId!, q.subjectId, q.period ?? "week");
    res.json(p);
  }),
);

userRouter.get(
  "/achievements",
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await prisma.userAchievement.findMany({ where: { userId: req.authUserId! } });
    res.json({ items: list });
  }),
);

userRouter.get(
  "/skill-summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = z.object({ subjectId: z.string().min(1) }).parse(req.query);
    const items = await getSkillSummaryForUser(req.authUserId!, q.subjectId);
    res.json({ items });
  }),
);

userRouter.put(
  "/settings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const b = z
      .object({
        settings: z.record(z.unknown()).optional(),
        onboardingComplete: z.boolean().optional(),
      })
      .parse(req.body);
    const current = await prisma.user.findUnique({ where: { id: req.authUserId! } });
    if (!current) {
      throw new HttpError("not found", 404);
    }
    const prev = (current.settings as Record<string, unknown> | null) ?? {};
    const data: { settings?: object; onboardingComplete?: boolean } = {};
    if (b.settings) {
      data.settings = { ...prev, ...b.settings };
    }
    if (b.onboardingComplete !== undefined) {
      data.onboardingComplete = b.onboardingComplete;
    }
    const u = await prisma.user.update({ where: { id: current.id }, data });
    res.json({ user: userToJson(u) });
  }),
);
