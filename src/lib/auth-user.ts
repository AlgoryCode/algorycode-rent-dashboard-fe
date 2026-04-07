type JwtPayload = Record<string, unknown>;

function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) return null;
  try {
    return JSON.parse(payloadRaw) as JwtPayload;
  } catch {
    return null;
  }
}

export function getExpFromAccessToken(token?: string | null): number | null {
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return null;
  const exp = payload.exp;
  if (exp >= 1e12) return Math.floor(exp / 1000);
  return exp;
}
