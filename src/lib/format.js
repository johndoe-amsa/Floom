import { FORMATS } from '../data'

export function ratio(format) {
  const f = FORMATS[format]
  return f[0] / f[1]
}

// Dimensions en pixels pour un côté long donné, selon le format.
export function dims(format, longSide) {
  const f = FORMATS[format]
  return f[0] >= f[1]
    ? [longSide, Math.round(longSide * f[1] / f[0])]
    : [Math.round(longSide * f[0] / f[1]), longSide]
}
