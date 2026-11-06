// Construction de la rampe de couleurs envoyée au shader (texture 1D de RAMP_N texels).
import { hexToRgb, srgbToOklab, oklabToSrgb } from './color'

export const RAMP_N = 1024
const BASE_N = 2048

const smooth = (x) => x * x * (3 - 2 * x)

// Mode palettes : rampe identique à l'ancien shader (5 couleurs réparties, transitions lissées).
export function buildPaletteRamp(colors) {
  const rgb = colors.map(hexToRgb)
  const out = new Uint8Array(RAMP_N * 4)
  const segs = rgb.length - 1
  for (let j = 0; j < RAMP_N; j++) {
    const t = Math.min(j / (RAMP_N - 1), 0.9999) * segs
    const k = Math.floor(t)
    const x = smooth(t - k)
    for (let c = 0; c < 3; c++) out[j * 4 + c] = Math.round((rgb[k][c] + (rgb[k + 1][c] - rgb[k][c]) * x) * 255)
    out[j * 4 + 3] = 255
  }
  return out
}

// Mode marque : rampe en fonction de la part de surface u (0–1).
// Chaque couleur occupe une part proportionnelle à son poids ; à l'intérieur de sa part,
// sa luminosité (et éventuellement sa teinte) varie de –écart à +écart autour de la valeur saisie.
export function buildBrandBase(brand) {
  const list = brand.colors
  const n = list.length
  const total = list.reduce((s, c) => s + c.weight, 0) || 1
  const p = list.map((c) => c.weight / total)
  const a = []
  let acc = 0
  for (let i = 0; i < n; i++) { a.push(acc); acc += p[i] }

  // Frontières entre couleurs et demi-largeur du fondu.
  const bounds = []
  for (let k = 1; k < n; k++) bounds.push({ b: a[k], h: brand.softness * 0.5 * Math.min(p[k - 1], p[k]) })
  const S = (k, u) => { // k = 1..n-1
    const { b, h } = bounds[k - 1]
    if (h <= 1e-6) return u >= b ? 1 : 0
    const x = Math.max(0, Math.min(1, (u - (b - h)) / (2 * h)))
    return smooth(x)
  }

  const labs = list.map((c) => srgbToOklab(hexToRgb(c.hex)))
  const dL = brand.variance * 0.3
  const dH = (brand.hueShift * Math.PI) / 180
  const shade = (lab, tone) => {
    let [L, A, B] = lab
    L = Math.max(0, Math.min(1, L + tone * dL))
    if (dH) {
      const ang = tone * dH
      const ca = Math.cos(ang), sa = Math.sin(ang)
      ;[A, B] = [A * ca - B * sa, A * sa + B * ca]
    }
    return [L, A, B]
  }

  const base = new Float32Array(BASE_N * 3)
  for (let j = 0; j < BASE_N; j++) {
    const u = j / (BASE_N - 1)
    const mix = [0, 0, 0]
    for (let i = 0; i < n; i++) {
      const lo = i === 0 ? 1 : S(i, u)
      const hi = i === n - 1 ? 0 : S(i + 1, u)
      const m = lo - hi
      if (m <= 0) continue
      const tone = Math.max(-1, Math.min(1, (2 * (u - a[i])) / p[i] - 1))
      const lab = shade(labs[i], tone)
      mix[0] += m * lab[0]; mix[1] += m * lab[1]; mix[2] += m * lab[2]
    }
    const rgb = oklabToSrgb(mix)
    base[j * 3] = rgb[0]; base[j * 3 + 1] = rgb[1]; base[j * 3 + 2] = rgb[2]
  }
  return base
}

// Égalisation : sorted = valeurs du champ triées (échantillon basse résolution).
// Le texel j correspond à la valeur v = min + j/(N-1)·(max-min) ; on lui associe sa part de
// surface u (rang dans l'échantillon), ce qui garantit que chaque couleur couvre sa proportion.
export function composeEqualized(base, sorted) {
  const out = new Uint8Array(RAMP_N * 4)
  const n = sorted.length
  const min = sorted[0], max = sorted[n - 1]
  const span = Math.max(max - min, 1e-6)
  let lo = 0, hi = 0
  for (let j = 0; j < RAMP_N; j++) {
    const v = min + (j / (RAMP_N - 1)) * span
    while (lo < n && sorted[lo] < v) lo++
    if (hi < lo) hi = lo
    while (hi < n && sorted[hi] <= v) hi++
    const u = Math.max(0, Math.min(1, (lo + hi) / 2 / n))
    const x = u * (BASE_N - 1)
    const k = Math.min(BASE_N - 2, Math.floor(x))
    const f = x - k
    for (let c = 0; c < 3; c++) {
      const a = base[k * 3 + c], b = base[(k + 1) * 3 + c]
      out[j * 4 + c] = Math.round((a + (b - a) * f) * 255)
    }
    out[j * 4 + 3] = 255
  }
  return { data: out, min, max: min + span }
}
