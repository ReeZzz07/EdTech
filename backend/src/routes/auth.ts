import { Router } from "express";
import { z } from "zod";
import { gamificationConfig } from "../config/gamification";
import { telegramConfig } from "../config/telegram";
import { prisma } from "../database/client";
import { requireAuth } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";
import { signAccessToken } from "../utils/authTokens";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";
import { userPayloadWithUsage } from "../utils/userPayload";
import { parseAndValidateInitData } from "../utils/validateTelegramInitData";

export const authRouter = Router();

authRouter.post(
  "/telegram",
  authRateLimit,
  asyncHandler(async (req, res) => {
    const bot = telegramConfig.botToken;
    if (!bot) {
      throw new HttpError("TELEGRAM_BOT_TOKEN не задан на сервере", 500, "config");
    }
    const body = z.object({ initData: z.string().min(1) }).parse(req.body);
    const parsed = parseAndValidateInitData(body.initData, bot);
    if (!parsed || !parsed.user) {
      throw new HttpError("Некорректные данные Telegram", 401, "telegram_invalid");
    }
    const u = parsed.user;
    const idRaw = u["id"];
    if (idRaw === undefined) {
      throw new HttpError("В initData нет user.id", 400, "bad_user");
    }
    const tg = BigInt(String(idRaw));
    const first = String(u["first_name"] ?? "Ученик");
    const last = u["last_name"] ? String(u["last_name"]) : null;
    const uname = u["username"] ? String(u["username"]) : null;
    const av = u["photo_url"] ? String(u["photo_url"]) : null;

    const user = await prisma.user.upsert({
      where: { telegramId: tg },
      create: {
        telegramId: tg,
        firstName: first,
        lastName: last,
        username: uname,
        avatar: av,
        coinBalance: gamificationConfig.defaultStartingCoins,
      },
      update: {
        firstName: first,
        lastName: last,
        username: uname,
        avatar: av,
      },
    });

    const token = signAccessToken(user.id, user.telegramId.toString());
    const payload = await userPayloadWithUsage(user);
    res.json({ token, user: payload });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = await userPayloadWithUsage(req.authUser!);
    res.json({ user: payload });
  }),
);
