export const VEHICLE_IMAGE_SLOTS = [
  { key: "front", label: "Ön" },
  { key: "rear", label: "Arka" },
  { key: "left", label: "Sol yan" },
  { key: "right", label: "Sağ yan" },
  { key: "interiorDash", label: "İç panel" },
  { key: "interiorRear", label: "Arka koltuk" },
] as const;

export type VehicleImageSlot = (typeof VEHICLE_IMAGE_SLOTS)[number]["key"];

/** data URL (base64) — demo; üretimde sunucuya yüklenmeli */
export type VehicleImages = Partial<Record<VehicleImageSlot, string>>;

export const MAX_VEHICLE_IMAGE_BYTES = 4 * 1024 * 1024;

export function compactVehicleImages(images: VehicleImages): VehicleImages | undefined {
  const entries = Object.entries(images).filter(([, v]) => typeof v === "string" && v.length > 0) as [VehicleImageSlot, string][];
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as VehicleImages;
}

export function hasVehicleGalleryImages(images?: VehicleImages): boolean {
  return Boolean(images && VEHICLE_IMAGE_SLOTS.some(({ key }) => Boolean(images[key])));
}
