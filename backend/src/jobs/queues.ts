import Bull from "bull";
import { redisConfig } from "../config/redis";
import { runDiagnosisForProblemId } from "../services/diagnosisService";
import { logger } from "../utils/logger";

const redis = redisConfig.url;

export type DiagnosisJobData = { problemId: string };

function createQ(name: string) {
  return new Bull<DiagnosisJobData>(name, {
    redis: redis,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
    },
  });
}

const diagnosisQ = createQ("diagnosis");

diagnosisQ.on("error", (e: Error) => logger.error({ e }, "diagnosis queue error"));

export { diagnosisQ };

export async function enqueueDiagnosis(problemId: string) {
  try {
    return await diagnosisQ.add(
      { problemId },
      { jobId: `problem:${problemId}`, removeOnComplete: true, removeOnFail: true },
    );
  } catch (e) {
    logger.warn({ e, problemId }, "diagnosis queue unavailable, run inline");
    setImmediate(() => {
      void runDiagnosisForProblemId(problemId).then((r) => logger.info({ problemId, r }, "inline diagnosis"));
    });
    return undefined;
  }
}
