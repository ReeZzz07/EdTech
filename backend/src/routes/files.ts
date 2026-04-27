import { Router } from "express";
import path from "node:path";
import { requireAuth } from "../middleware/auth";
import { localFileAbsolute } from "../services/imageService";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

const safe = /^[a-f0-9-]{8,}\.[A-Za-z0-9]+$/i;

export const filesRouter = Router();

filesRouter.get(
  "/:userId/:fileName",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, fileName } = req.params;
    if (req.authUserId !== userId) {
      throw new HttpError("Нет доступа", 403, "forbidden");
    }
    if (!fileName || !safe.test(fileName)) {
      throw new HttpError("Некорректное имя файла", 400, "bad_file");
    }
    const key = path.posix.join(userId, fileName);
    const abs = localFileAbsolute(key);
    res.sendFile(abs, { maxAge: 86_400_000, headers: { "Cache-Control": "private, max-age=86400" } });
  }),
);
