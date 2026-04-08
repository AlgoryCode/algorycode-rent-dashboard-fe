import type { CustomerInfo } from "@/lib/mock-fleet";

export function buildRentalRequestUrl(origin: string, customer: CustomerInfo): string {
  const p = new URLSearchParams();
  if (customer.fullName) p.set("fullName", customer.fullName);
  if (customer.phone) p.set("phone", customer.phone);
  if (customer.nationalId) p.set("nationalId", customer.nationalId);
  if (customer.passportNo) p.set("passportNo", customer.passportNo);
  if (customer.email) p.set("email", customer.email);
  if (customer.birthDate) p.set("birthDate", customer.birthDate);
  if (customer.driverLicenseNo) p.set("driverLicenseNo", customer.driverLicenseNo);
  return `${origin.replace(/\/$/, "")}/talep?${p.toString()}`;
}

export function buildRentalRequestMessage(customerName: string, requestUrl: string): string {
  return `Merhaba ${customerName}, yeni kiralama talebinizi bu bağlantıdan oluşturabilirsiniz: ${requestUrl}`;
}

/** Boş talep formu (ön doldurma yok); müşteri yalnızca bu sayfada kalacak şekilde kilitlenir. */
export function buildEmptyTalepFormUrl(_origin: string): string {
  return "https://rent.algorycode.com/talep/p";
}

export function buildEmptyTalepFormMessage(customerName: string, formUrl: string): string {
  return `Merhaba ${customerName}, kiralama talep formunu bu bağlantıdan doldurabilirsiniz: ${formUrl}`;
}

export function buildGenericTalepFormInviteMessage(formUrl: string): string {
  return `Merhaba, kiralama talep formunu bu bağlantıdan doldurabilirsiniz: ${formUrl}`;
}

export function normalizedPhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return `9${digits}`;
  return digits;
}
