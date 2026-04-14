/** Tarayıcıda JWT payload JSON’unu okur (httpOnly çerezden gelen token’ı `/api/auth/access-token` ile aldıktan sonra). */
export function decodeJwtPayloadBrowser(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type SessionIdentityFromJwt = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

function pickJwtString(payload: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Auth JWT’de yaygın alan adlarıyla ad, soyad ve e-posta okur. */
export function parseSessionIdentityFromJwtPayload(
  payload: Record<string, unknown> | null,
): SessionIdentityFromJwt {
  if (!payload) return { email: null, firstName: null, lastName: null };

  let email = pickJwtString(payload, ["email"]);
  const sub = pickJwtString(payload, ["sub"]);
  if (!email && sub?.includes("@")) email = sub;

  let firstName = pickJwtString(payload, [
    "firstName",
    "first_name",
    "given_name",
    "givenName",
  ]);
  let lastName = pickJwtString(payload, [
    "lastName",
    "last_name",
    "family_name",
    "familyName",
  ]);

  const fullName = pickJwtString(payload, ["name", "fullName", "displayName"]);
  if (!firstName && !lastName && fullName) {
    const bits = fullName.split(/\s+/).filter(Boolean);
    if (bits.length >= 2) {
      firstName = bits.slice(0, -1).join(" ");
      lastName = bits[bits.length - 1] ?? null;
    } else if (bits.length === 1) {
      firstName = bits[0] ?? null;
    }
  }

  return { email, firstName, lastName };
}

export function formatSessionDisplayName(id: SessionIdentityFromJwt | null | undefined): string {
  if (!id) return "Hesap";
  const parts = [id.firstName?.trim(), id.lastName?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (id.email?.includes("@")) {
    const local = id.email.split("@")[0]?.trim();
    if (local) return local;
  }
  if (id.email?.trim()) return id.email.trim();
  return "Hesap";
}

export function initialsFromSessionIdentity(id: SessionIdentityFromJwt | null | undefined): string {
  if (!id) return "?";
  const f = id.firstName?.trim();
  const l = id.lastName?.trim();
  if (f && l) {
    const a = f.codePointAt(0);
    const b = l.codePointAt(0);
    if (a != null && b != null) {
      return (String.fromCodePoint(a) + String.fromCodePoint(b)).toLocaleUpperCase("tr-TR");
    }
  }
  const glued = [f, l].filter(Boolean).join(" ");
  if (glued.length >= 2) return glued.slice(0, 2).toLocaleUpperCase("tr-TR");
  if (f) return f.slice(0, 2).toLocaleUpperCase("tr-TR");
  return initialsFromSessionHint(id.email);
}

export function initialsFromSessionHint(hint: string | null | undefined): string {
  const s = hint?.trim();
  if (!s) return "?";
  if (s.includes("@")) {
    const local = s.split("@")[0]?.trim() || s;
    const cleaned = local.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, "");
    if (cleaned.length >= 2) return cleaned.slice(0, 2).toLocaleUpperCase("tr-TR");
    if (cleaned.length === 1) return cleaned.toLocaleUpperCase("tr-TR");
    return local.slice(0, 2).toLocaleUpperCase("tr-TR");
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[1]?.[0];
    if (a && b) return (a + b).toLocaleUpperCase("tr-TR");
  }
  return s.slice(0, 2).toLocaleUpperCase("tr-TR");
}
