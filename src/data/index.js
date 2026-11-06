export const PALETTES = [
  { name: 'Lagon',      colors: ['#b7e84a', '#7fd9b4', '#8fdcee', '#bdeaf2', '#a6e6ee'] },
  { name: 'Pervenche',  colors: ['#e3e6ff', '#a49ef7', '#b9c4fb', '#7f93f7', '#31b0e0'] },
  { name: 'Sorbet',     colors: ['#fbe04e', '#fde9a5', '#f893b4', '#fbc6da', '#fde4e8'] },
  { name: 'Azur',       colors: ['#1b5fc2', '#1d8ff0', '#59a8ff', '#8fc4fb', '#b6dafc'] },
  { name: 'Forêt',      colors: ['#17803f', '#2fb36a', '#77d58d', '#b5ecd0', '#7fdce4'] },
  { name: 'Ambre',      colors: ['#d9602b', '#f08a45', '#f9aa7a', '#fbc9b8', '#f4a07f'] },
  { name: 'Bonbon',     colors: ['#f6c4fb', '#f67fb7', '#f8b5d4', '#fbc7c0', '#f0b04a'] },
  { name: 'Ciel',       colors: ['#8fd5fb', '#6bc4f2', '#8ad3cb', '#5fb27a', '#7dd0d8'] },
  { name: 'Aqua',       colors: ['#bfeaf4', '#8be0ea', '#a9ebf0', '#c4f0b5', '#d6f5e8'] },
]

export const FORMATS = { '1:1': [1, 1], '4:5': [4, 5], '3:2': [3, 2], '16:9': [16, 9] }
export const EXPORT_SIZES = [1080, 2048, 4096]

export const VARIATION_COUNT = 6
export const THUMB_LONG_SIDE = 360
export const PREVIEW_MAX_SIDE = 1600

export const SLIDERS = [
  { key: 'scale',    label: 'Échelle',             min: 0.4, max: 3,   step: 0.05, decimals: 2 },
  { key: 'warp',     label: 'Déformation',         min: 0,   max: 4,   step: 0.05, decimals: 2 },
  { key: 'contrast', label: 'Contraste des zones', min: 1,   max: 4,   step: 0.05, decimals: 2 },
  { key: 'streak',   label: 'Traînées de lumière', min: 0,   max: 1,   step: 0.01, decimals: 2 },
  { key: 'angle',    label: 'Rotation',            min: 0,   max: 360, step: 1,    decimals: 0, unit: '°' },
  { key: 'grain',    label: 'Grain',               min: 0,   max: 1,   step: 0.01, decimals: 2 },
]

export const INITIAL_STATE = {
  colors: PALETTES[0].colors.slice(),
  paletteIndex: 0,
  scale: 0.9, warp: 1.5, contrast: 2.2, streak: 0.6, angle: 20, grain: 0,
  seed: 7, format: '1:1', exportSize: 2048,
  mode: 'palette',
}

// ---------- Mode « Couleurs de marque » ----------
export const MAX_BRAND_COLORS = 8

export const BRAND_SLIDERS = [
  { key: 'variance', label: 'Écart de luminosité', min: 0, max: 1,  step: 0.01, decimals: 0, scale: 100, unit: ' %' },
  { key: 'hueShift', label: 'Écart de teinte',     min: 0, max: 30, step: 1,    decimals: 0, unit: '°' },
  { key: 'softness', label: 'Fondu entre couleurs', min: 0, max: 1, step: 0.01, decimals: 0, scale: 100, unit: ' %' },
]

export const DEFAULT_BRAND = {
  colors: [
    { hex: '#1B5FC2', weight: 60 },
    { hex: '#59A8FF', weight: 30 },
    { hex: '#FFFFFF', weight: 10 },
  ],
  variance: 0.25,
  hueShift: 0,
  softness: 0.7,
}
