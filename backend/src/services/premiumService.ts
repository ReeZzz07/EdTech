import type { User } from "@prisma/client";

/** Premium активен и не истёк по premiumUntil (флаг isPremium в БД может отставать до синхронизации). */
export function userHasActivePremium(u: Pick<User, "isPremium" | "premiumUntil">): boolean {
  if (!u.isPremium) return false;
  if (u.premiumUntil != null && u.premiumUntil.getTime() <= Date.now()) return false;
  return true;
}
