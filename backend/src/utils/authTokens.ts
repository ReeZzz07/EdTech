import jwt from "jsonwebtoken";
import { getJwtSecret, jwtConfig } from "../config";
import { HttpError } from "./httpError";

const ISS = "ege-pro";

type Payload = { sub: string; tg?: string };

export function signAccessToken(userId: string, telegramId: string): string {
  return jwt.sign({ sub: userId, tg: telegramId, iss: ISS }, getJwtSecret(), {
    expiresIn: `${jwtConfig.expiresIn}d`,
  });
}

export function verifyAccessToken(token: string): Payload {
  try {
    const p = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & Payload;
    if (typeof p.sub !== "string") throw new Error("bad sub");
    return p;
  } catch {
    throw new HttpError("Invalid token", 401, "unauthorized");
  }
}
