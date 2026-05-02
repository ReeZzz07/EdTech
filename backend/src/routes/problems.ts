import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import { uploadRateLimit } from "../middleware/rateLimit";
import { enqueueDiagnosis } from "../jobs/queues";
import { assertCanCreateProblem } from "../services/limitsService";
import { saveProblemImage } from "../services/imageService";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

function extFromMime(m: string) {
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return "jpg";
}

export const problemsRouter = Router();

problemsRouter.post(
  "/upload",
  requireAuth,
  uploadRateLimit,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError("Нужен файл `image` (multipart)", 400, "file_required");
    }
    const body = z.object({ subjectId: z.string().min(1) }).parse(req.body);
    const uid = req.authUserId!;

    await assertCanCreateProblem(uid);

    const sub = await prisma.subject.findFirst({
      where: { id: body.subjectId, isEnabled: true },
    });
    if (!sub) {
      throw new HttpError("Предмет не найден", 400, "bad_subject");
    }

    const ext = extFromMime(req.file.mimetype);
    const { imageKey, imageUrl } = await saveProblemImage(uid, req.file.buffer, ext);

    const p = await prisma.problem.create({
      data: {
        userId: uid,
        subjectId: sub.id,
        imageUrl,
        imageKey,
        status: "analyzing",
      },
    });
    void enqueueDiagnosis(p.id);
    res.json({ problemId: p.id, status: p.status as string });
  }),
);

problemsRouter.get(
  "/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = await prisma.problem.findFirst({
      where: { id: req.params.id, userId: req.authUserId! },
      select: { id: true, status: true, imageUrl: true, createdAt: true, completedAt: true, rewardsApplied: true },
    });
    if (!p) {
      throw new HttpError("Not found", 404, "not_found");
    }
    res.json(p);
  }),
);

problemsRouter.get(
  "/:id/diagnosis",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = await prisma.problem.findFirst({
      where: { id: req.params.id, userId: req.authUserId! },
      include: { diagnosis: true, subject: { select: { name: true, code: true } } },
    });
    if (!p || p.status === "analyzing") {
      res.json({ status: p?.status ?? "missing", diagnosis: null });
      return;
    }
    if (p.status === "error" || !p.diagnosis) {
      res.json({ status: p.status, diagnosis: null, error: p.status === "error" ? "ai_failed" : null });
      return;
    }
    res.json({
      status: p.status,
      problem: {
        id: p.id,
        subjectId: p.subjectId,
        imageUrl: p.imageUrl,
        topic: p.topic,
        difficulty: p.difficulty,
        subject: p.subject,
        originalText: p.originalText,
        studentSolution: p.studentSolution,
        bankTaskId: p.bankTaskId,
      },
      diagnosis: p.diagnosis,
    });
  }),
);

problemsRouter.post(
  "/:id/feedback",
  requireAuth,
  asyncHandler(async (req, res) => {
    const b = z
      .object({ quality: z.number().int().min(1).max(5).optional(), comment: z.string().max(2000).optional() })
      .parse(req.body);
    const p = await prisma.problem.findFirst({ where: { id: req.params.id, userId: req.authUserId! } });
    if (!p) {
      throw new HttpError("Not found", 404, "not_found");
    }
    const fb = await prisma.problemFeedback.upsert({
      where: { userId_problemId: { userId: req.authUserId!, problemId: p.id } },
      create: { userId: req.authUserId!, problemId: p.id, quality: b.quality, comment: b.comment },
      update: { quality: b.quality, comment: b.comment },
    });
    res.json({ id: fb.id, ok: true });
  }),
);
