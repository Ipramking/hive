/** Append an alpha value (0-1) to a #rrggbb hex, returning #rrggbbaa. */
export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const aa = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${full}${aa}`
}
