export const jwtConfig = {
  /** дней */
  expiresIn: Number(process.env.JWT_EXPIRES_DAYS ?? 14),
} as const;

export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET не задан");
  }
  return s;
}
