/** #RGB veya #RRGGBB — native color input için #RRGGBB üretir */
export function normalizeHexForColorPicker(hex: string): string {
  const s = hex.trim().toUpperCase();
  const m = /^#([0-9A-F]{3}|[0-9A-F]{6})$/.exec(s);
  if (!m) return "#808080";
  const g = m[1];
  if (g.length === 3) {
    return `#${g[0]}${g[0]}${g[1]}${g[1]}${g[2]}${g[2]}`;
  }
  return s;
}
