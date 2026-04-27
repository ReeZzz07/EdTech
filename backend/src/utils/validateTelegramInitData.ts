import crypto from "node:crypto";

const MAX_AGE_DEFAULT_SEC = 86_400;

/**
 * @returns распарсенные пары (без hash) + расшарсенный `user` как объект, или null
 */
export function parseAndValidateInitData(
  initData: string,
  botToken: string,
  maxAgeSec = MAX_AGE_DEFAULT_SEC,
): { user: Record<string, unknown> | null; raw: Record<string, string> } | null {
  const usp = new URLSearchParams(initData);
  const hash = usp.get("hash");
  if (!hash) return null;

  const dataCheck: string[] = [];
  const keys = [...new Set(usp.keys())]
    .filter((k) => k !== "hash")
    .sort();
  for (const k of keys) {
    const v = usp.get(k);
    if (v !== null) {
      dataCheck.push(`${k}=${v}`);
    }
  }
  const dataCheckString = dataCheck.join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const check = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (check !== hash) return null;

  const auth = usp.get("auth_date");
  if (auth) {
    const t = Number(auth);
    if (Number.isFinite(t) && Date.now() / 1000 - t > maxAgeSec) {
      return null;
    }
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of usp.entries()) {
    if (k === "hash") continue;
    raw[k] = v;
  }

  let user: Record<string, unknown> | null = null;
  if (raw.user) {
    try {
      user = JSON.parse(raw.user) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return { user, raw };
}
