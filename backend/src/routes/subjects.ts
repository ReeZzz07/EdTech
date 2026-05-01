import { Router } from "express";
import { listEnabledSubjects } from "../services/subjectService";
import { asyncHandler } from "../utils/asyncHandler";

export const subjectsRouter = Router();

subjectsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await listEnabledSubjects();
    res.json({
      items: rows.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        isEnabled: s.isEnabled,
        sortOrder: s.sortOrder,
        fipiSpecKey: s.fipiSpecKey,
        skillMap: s.skillMap,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  }),
);
