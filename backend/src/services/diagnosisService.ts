import { prisma } from "../database/client";
import { readImageBufferForProblem } from "./imageService";
import { runDiagnosisForImage } from "./aiService";
import { tryEarnForDiagnosis } from "./coinService";
import { onProblemDiagnosed } from "./gamificationService";
import { logger } from "../utils/logger";

export async function runDiagnosisForProblemId(problemId: string) {
  const p = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { subject: true, user: true },
  });
  if (!p) return { ok: false as const, reason: "not_found" as const };
  if (p.status === "completed" || p.rewardsApplied) {
    return { ok: true as const, reason: "already_done" as const };
  }
  if (p.status === "error") {
    return { ok: false as const, reason: "in_error" as const };
  }

  const key = p.imageKey;
  if (!key) {
    await prisma.problem.update({
      where: { id: p.id },
      data: { status: "error", completedAt: new Date() },
    });
    return { ok: false as const, reason: "no_image_key" as const };
  }
  let buf: Buffer;
  try {
    buf = await readImageBufferForProblem(key);
  } catch (e) {
    logger.error({ e, problemId }, "read image");
    await prisma.problem.update({
      where: { id: p.id },
      data: { status: "error", completedAt: new Date() },
    });
    return { ok: false as const, reason: "read" as const };
  }

  let ai: Awaited<ReturnType<typeof runDiagnosisForImage>>;
  try {
    ai = await runDiagnosisForImage({ subjectName: p.subject.name, imageBuffer: buf });
  } catch (e) {
    logger.error({ e, problemId }, "ai");
    await prisma.problem.update({
      where: { id: p.id },
      data: { status: "error", completedAt: new Date() },
    });
    return { ok: false as const, reason: "ai" as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.problem.update({
      where: { id: p.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        topic: ai.topic,
        difficulty: ai.difficulty,
        originalText: ai.originalText,
        correctSolution: ai.correctSolution,
        explanation: ai.explanation,
        rewardsApplied: true,
      },
    });
    await tx.diagnosis.create({
      data: {
        problemId: p.id,
        overallScore: ai.overallScore,
        timeSpent: null,
        steps: ai.steps,
        errors: ai.errors,
        recommendations: ai.recommendations,
        skillAssessment: ai.skillAssessment,
        coinsEarned: ai.coinsBase,
      },
    });
  });
  await tryEarnForDiagnosis(p.userId, p.id, ai.coinsBase);
  await onProblemDiagnosed({ userId: p.userId, problemId: p.id, overallScore: ai.overallScore });
  const earned = await prisma.coinTransaction.findFirst({
    where: { userId: p.userId, type: "diagnosis_earn", refId: p.id },
  });
  if (earned) {
    await prisma.diagnosis.update({
      where: { problemId: p.id },
      data: { coinsEarned: earned.amount },
    });
  }
  return { ok: true as const, reason: "ok" as const };
}
