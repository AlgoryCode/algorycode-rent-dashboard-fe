/** AuthService ErrorResponse veya ProblemDetail benzeri gövdelerden okunabilir metin. */
export function getJsonErrorText(data: unknown): string {
  if (data == null || typeof data !== "object") return "";
  const o = data as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  if (typeof o.detail === "string" && o.detail.trim()) return o.detail.trim();
  if (Array.isArray(o.errors) && o.errors.length > 0) {
    const first = o.errors[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return "";
}
