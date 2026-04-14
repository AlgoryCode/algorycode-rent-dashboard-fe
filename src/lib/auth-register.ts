export async function registerPanelUser(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}): Promise<void> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await res.text();
  let data: { message?: string } = {};
  try {
    data = text ? (JSON.parse(text) as { message?: string }) : {};
  } catch {
    data = { message: text || "Kayıt başarısız" };
  }
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : `Kayıt başarısız (${res.status})`);
  }
}
