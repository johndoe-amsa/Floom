// Conversions de couleurs : hex, RGB 0–255, OKLab (espace perceptuel).

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function hexToRgb255(hex) {
  return hexToRgb(hex).map((v) => Math.round(v * 255))
}

export function rgb255ToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

// Accepte « #1B5FC2 », « 1B5FC2 », « #15C », « 27, 95, 194 », « 27 95 194 », « rgb(27, 95, 194) ».
// Renvoie la couleur en hex majuscule, ou null si la saisie n'est pas valide.
export function parseColor(input) {
  const s = String(input).trim()
  let m = s.match(/^#?([0-9a-f]{6})$/i)
  if (m) return '#' + m[1].toUpperCase()
  m = s.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (m) return ('#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3]).toUpperCase()
  m = s.match(/^(?:rgba?\s*\()?\s*(\d{1,3})\s*[,;\s]\s*(\d{1,3})\s*[,;\s]\s*(\d{1,3})\s*(?:[,;\s]\s*[\d.]+\s*)?\)?$/i)
  if (m) {
    const v = [m[1], m[2], m[3]].map(Number)
    if (v.every((x) => x <= 255)) return rgb255ToHex(v[0], v[1], v[2])
  }
  return null
}

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)

// sRGB (0–1) → OKLab [L, a, b]
export function srgbToOklab([r, g, b]) {
  r = toLin(r); g = toLin(g); b = toLin(b)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

// OKLab → sRGB (0–1), borné au gamut.
export function oklabToSrgb([L, a, b]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3)
  const out = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
  return out.map((v) => Math.max(0, Math.min(1, toSrgb(Math.max(0, Math.min(1, v))))))
}
