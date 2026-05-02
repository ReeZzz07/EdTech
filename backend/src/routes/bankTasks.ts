import { Router } from "express";
import { z } from "zod";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import { uploadRateLimit } from "../middleware/rateLimit";
import { enqueueDiagnosis } from "../jobs/queues";
import { assertCanCreateProblem } from "../services/limitsService";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

export const bankTasksRouter = Router();

bankTasksRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        subjectId: z.string().min(1).optional(),
      })
      .parse(req.query);
    const where = {
      isPublished: true,
      ...(q.subjectId ? { subjectId: q.subjectId } : {}),
    };
    const items = await prisma.bankTask.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        difficulty: true,
        topicTag: true,
        subjectId: true,
        subject: { select: { name: true, code: true } },
      },
    });
    res.json({ items });
  }),
);

bankTasksRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const t = await prisma.bankTask.findFirst({
      where: { id: req.params.id, isPublished: true },
      include: { subject: { select: { name: true, code: true } } },
    });
    if (!t) {
      throw new HttpError("Not found", 404, "not_found");
    }
    res.json({ task: t });
  }),
);

bankTasksRouter.post(
  "/:id/submit",
  requireAuth,
  uploadRateLimit,
  asyncHandler(async (req, res) => {
    const b = z.object({ answerText: z.string().min(1).max(50_000) }).parse(req.body);
    const uid = req.authUserId!;

    const task = await prisma.bankTask.findFirst({
      where: { id: req.params.id, isPublished: true },
    });
    if (!task) {
      throw new HttpError("Not found", 404, "not_found");
    }

    const sub = await prisma.subject.findFirst({
      where: { id: task.subjectId, isEnabled: true },
    });
    if (!sub) {
      throw new HttpError("Предмет недоступен", 400, "bad_subject");
    }

    await assertCanCreateProblem(uid);

    const p = await prisma.problem.create({
      data: {
        userId: uid,
        subjectId: task.subjectId,
        bankTaskId: task.id,
        imageUrl: "bank://task",
        imageKey: null,
        originalText: task.body,
        studentSolution: b.answerText,
        status: "analyzing",
        topic: task.topicTag || "",
        difficulty: task.difficulty,
      },
    });
    void enqueueDiagnosis(p.id);
    res.json({ problemId: p.id, status: p.status as string });
  }),
);
