import { PHONE_COUNTRY_CODES } from "@/lib/phone-country-codes";

/** Kayıtlı telefon metnini ülke kodu + yerel numaraya böler (form alanları için). */
export function splitPhoneToCountryAndLocal(phone: string): { code: string; local: string } {
  const trimmed = phone.replace(/\s+/g, " ").trim();
  if (!trimmed) return { code: "+90", local: "" };
  const sorted = [...PHONE_COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const { code } of sorted) {
    if (trimmed.startsWith(code)) {
      return { code, local: trimmed.slice(code.length).trim() };
    }
  }
  return { code: "+90", local: trimmed };
}
