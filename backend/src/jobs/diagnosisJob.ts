import { diagnosisQ } from "./queues";
import { runDiagnosisForProblemId } from "../services/diagnosisService";
import { logger } from "../utils/logger";

let started = false;

export function startDiagnosisWorker() {
  if (started) return;
  started = true;
  const concurrency = 2;
  void diagnosisQ.process(concurrency, async (job) => {
    const { problemId } = job.data;
    const r = await runDiagnosisForProblemId(problemId);
    logger.info({ problemId, r }, "diagnosis job done");
  });
}
