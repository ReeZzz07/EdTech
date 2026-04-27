import type { RequestHandler } from "express";
import { prisma } from "../database/client";
import { verifyAccessToken } from "../utils/authTokens";
import { HttpError } from "../utils/httpError";

const bearer = /^Bearer\s+(.+)$/i;

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const h = req.header("Authorization") ?? "";
  const m = bearer.exec(h);
  if (!m) return next(new HttpError("Требуется Authorization: Bearer", 401, "unauthorized"));
  const raw = m[1];
  if (!raw) return next(new HttpError("Invalid Authorization", 401, "unauthorized"));
  try {
    const { sub } = verifyAccessToken(raw);
    const u = await prisma.user.findUnique({ where: { id: sub } });
    if (!u) return next(new HttpError("Пользователь не найден", 401, "unauthorized"));
    req.authUserId = u.id;
    req.authUser = u;
    return next();
  } catch (e) {
    return next(e);
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const h = req.header("Authorization") ?? "";
  const m = bearer.exec(h);
  if (!m) return next();
  try {
    const { sub } = verifyAccessToken(m[1]!);
    const u = await prisma.user.findUnique({ where: { id: sub } });
    if (u) {
      req.authUserId = u.id;
      req.authUser = u;
    }
  } catch {
    // ignore
  }
  return next();
};
