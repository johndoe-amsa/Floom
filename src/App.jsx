import { useEffect, useRef, useState } from 'react'
import { PALETTES, FORMATS, EXPORT_SIZES, SLIDERS, INITIAL_STATE, DEFAULT_BRAND, MAX_BRAND_COLORS, THUMB_LONG_SIDE, PREVIEW_MAX_SIDE } from './data'
import { makeRenderer } from './lib/renderer'
import { ratio, dims } from './lib/format'
import { randSeed, rand, newVariantSeeds } from './lib/random'
import { downloadBlob } from './lib/download'
import { useRafCallback } from './hooks/useRafCallback'
import PalettePicker from './components/PalettePicker'
import ColorSwatches from './components/ColorSwatches'
import RangeField from './components/RangeField'
import Variations from './components/Variations'
import ModeSwitch from './components/ModeSwitch'
import BrandColors from './components/BrandColors'
import { parseColor } from './lib/color'

const BRAND_STORAGE_KEY = 'degrades.brand.v1'

// Reprend les couleurs de marque enregistrées dans ce navigateur, si elles sont valides.
function loadBrand() {
  try {
    const raw = JSON.parse(localStorage.getItem(BRAND_STORAGE_KEY))
    if (!raw || !Array.isArray(raw.colors) || !raw.colors.length) return DEFAULT_BRAND
    const colors = raw.colors.slice(0, MAX_BRAND_COLORS)
      .map((c) => ({ hex: parseColor(c.hex), weight: Math.max(1, Math.min(100, Math.round(Number(c.weight) || 50))) }))
      .filter((c) => c.hex)
    if (!colors.length) return DEFAULT_BRAND
    const num = (v, lo, hi, d) => (typeof v === 'number' && v >= lo && v <= hi ? v : d)
    return {
      colors,
      variance: num(raw.variance, 0, 1, DEFAULT_BRAND.variance),
      hueShift: num(raw.hueShift, 0, 30, DEFAULT_BRAND.hueShift),
      softness: num(raw.softness, 0, 1, DEFAULT_BRAND.softness),
    }
  } catch {
    return DEFAULT_BRAND
  }
}

function initialState() {
  let mode = 'palette'
  try { if (localStorage.getItem(BRAND_STORAGE_KEY + '.mode') === 'brand') mode = 'brand' } catch { /* ignoré */ }
  return { ...INITIAL_STATE, mode, brand: loadBrand() }
}

function initialVariantSeeds() {
  const seeds = newVariantSeeds()
  seeds[0] = INITIAL_STATE.seed
  return seeds
}

export default function App() {
  const [state, setState] = useState(initialState)
  const [variantSeeds, setVariantSeeds] = useState(initialVariantSeeds)
  const [seedText, setSeedText] = useState(String(INITIAL_STATE.seed))
  const [status, setStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [webgl, setWebgl] = useState(true)

  const stageRef = useRef(null)
  const previewRef = useRef(null)
  const thumbRefs = useRef([])
  const renderers = useRef(null) // { main, aux }

  // Dernières valeurs, lues au moment du rendu (dans la frame suivante).
  const stateRef = useRef(state)
  stateRef.current = state
  const seedsRef = useRef(variantSeeds)
  seedsRef.current = variantSeeds

  const update = (patch) => setState((s) => ({ ...s, ...patch }))
  const updateBrand = (patch) => setState((s) => ({ ...s, brand: { ...s.brand, ...patch } }))
  const aspect = ratio(state.format)

  // ---------- Rendu ----------
  const renderMain = useRafCallback(() => {
    const r = renderers.current
    const canvas = previewRef.current
    if (!r || !canvas) return
    const s = stateRef.current
    const ar = ratio(s.format)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = canvas.clientWidth || 600
    let w = Math.max(2, Math.round(cssW * dpr))
    let h = Math.max(2, Math.round(w / ar))
    const m = Math.max(w, h)
    if (m > PREVIEW_MAX_SIDE) { const k = PREVIEW_MAX_SIDE / m; w = Math.round(w * k); h = Math.round(h * k) }
    r.main.draw(s, w, h)
  })

  const renderThumbs = useRafCallback(() => {
    const r = renderers.current
    if (!r) return
    const s = stateRef.current
    const d = dims(s.format, THUMB_LONG_SIDE)
    seedsRef.current.forEach((seed, i) => {
      const c = thumbRefs.current[i]
      if (!c) return
      r.aux.draw({ ...s, seed }, d[0], d[1])
      c.width = d[0]
      c.height = d[1]
      c.getContext('2d').drawImage(r.aux.canvas, 0, 0)
    })
  })

  // Initialisation WebGL (une seule fois).
  useEffect(() => {
    if (renderers.current) return
    const main = makeRenderer(previewRef.current)
    const aux = main ? makeRenderer(document.createElement('canvas')) : null
    if (!main || !aux) { setWebgl(false); return }
    renderers.current = { main, aux }
    renderMain()
    renderThumbs()
  }, [renderMain, renderThumbs])

  // Redessine l'aperçu quand la taille de la zone change.
  useEffect(() => {
    if (!window.ResizeObserver || !stageRef.current) return
    const ro = new ResizeObserver(() => renderMain())
    ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [renderMain])

  const { colors, scale, warp, contrast, streak, angle, grain, seed, format, mode, brand } = state
  useEffect(() => { renderMain() }, [renderMain, colors, scale, warp, contrast, streak, angle, grain, seed, format, mode, brand])
  useEffect(() => { renderThumbs() }, [renderThumbs, colors, scale, warp, contrast, streak, angle, grain, format, mode, brand, variantSeeds])

  // Mémorise les couleurs de marque et le mode dans ce navigateur.
  useEffect(() => {
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand))
      localStorage.setItem(BRAND_STORAGE_KEY + '.mode', mode)
    } catch { /* stockage indisponible : sans conséquence */ }
  }, [brand, mode])

  // ---------- Actions ----------
  const setSeed = (v) => { update({ seed: v }); setSeedText(String(v)) }

  const onSeedInput = (e) => {
    setSeedText(e.target.value)
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v) && v >= 1 && v <= 99999) setSeed(v)
  }

  const onRandom = () => {
    const v = randSeed()
    update({
      seed: v,
      angle: Math.round(rand(0, 360)),
      scale: Math.round(rand(0.4, 1.0) * 20) / 20,
      warp: Math.round(rand(0.6, 1.8) * 20) / 20,
      streak: Math.round(rand(0.2, 0.8) * 20) / 20,
    })
    setSeedText(String(v))
  }

  const onExport = async () => {
    const r = renderers.current
    if (!r) return
    setExporting(true)
    setStatus('Génération du PNG…')
    try {
      const s = stateRef.current
      const d = dims(s.format, s.exportSize)
      r.aux.draw(s, d[0], d[1])
      const blob = await new Promise((res) => r.aux.canvas.toBlob(res, 'image/png'))
      if (!blob) throw new Error('export')
      const filename = 'degrade-' + (s.mode === 'brand' ? 'marque-' : '') + s.format.replace(':', 'x') + '-' + s.seed + '.png'
      downloadBlob(blob, filename)
      setStatus('Fichier généré : ' + filename + ' (' + d[0] + ' × ' + d[1] + ' px).')
    } catch {
      setStatus('L’export a échoué. Essayez une taille plus petite.')
    } finally {
      setExporting(false)
      renderMain()
      renderThumbs()
    }
  }

  const off = !webgl

  return (
    <div className="page">
      <header>
        <h1>Générateur de dégradés</h1>
        <p className="lead">Des dégradés doux et fluides, générés par un shader. Choisissez une palette ou vos couleurs de marque, ajustez les réglages, puis exportez en PNG.</p>
      </header>

      <main className="layout">
        <section className="stage" aria-label="Aperçu" ref={stageRef} style={{ '--ar': aspect }}>
          <canvas id="preview" ref={previewRef} role="img" aria-label="Aperçu du dégradé" hidden={off} />
          {off && (
            <p className="stage__msg">WebGL n’est pas disponible dans ce navigateur. Le générateur ne peut pas afficher de rendu.</p>
          )}
        </section>

        <div className="panel">
          <ModeSwitch mode={state.mode} disabled={off} onChange={(m) => update({ mode: m })} />

          {state.mode === 'brand' ? (
            <BrandColors brand={state.brand} disabled={off} onChange={updateBrand} />
          ) : (
            <>
              <PalettePicker
                activeIndex={state.paletteIndex}
                disabled={off}
                onSelect={(i) => update({ colors: PALETTES[i].colors.slice(), paletteIndex: i })}
              />

              <ColorSwatches
                colors={state.colors}
                disabled={off}
                onChange={(i, value) => setState((s) => {
                  const next = s.colors.slice()
                  next[i] = value
                  return { ...s, colors: next, paletteIndex: -1 }
                })}
              />
            </>
          )}

          <div className="group">
            <span className="label">Réglages</span>
            {SLIDERS.map((sl) => (
              <RangeField
                key={sl.key}
                id={sl.key}
                {...sl}
                value={state[sl.key]}
                disabled={off}
                onChange={(v) => update({ [sl.key]: v })}
              />
            ))}
          </div>

          <div className="row2">
            <div className="field">
              <label className="label" htmlFor="s-format">Format</label>
              <select id="s-format" value={state.format} disabled={off} onChange={(e) => update({ format: e.target.value })}>
                {Object.keys(FORMATS).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="s-size">Export</label>
              <select id="s-size" value={String(state.exportSize)} disabled={off} onChange={(e) => update({ exportSize: parseInt(e.target.value, 10) })}>
                {EXPORT_SIZES.map((n) => <option key={n} value={n}>{n} px</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="n-seed">Graine</label>
              <input type="number" id="n-seed" min="1" max="99999" step="1" inputMode="numeric" value={seedText} disabled={off} onChange={onSeedInput} />
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn btn--primary" id="b-export" disabled={off || exporting} onClick={onExport}>Exporter en PNG</button>
            <button type="button" className="btn" id="b-random" disabled={off} onClick={onRandom}>Au hasard</button>
          </div>
          <p className="status" id="status" role="status">{status}</p>
        </div>
      </main>

      <Variations
        seeds={variantSeeds}
        activeSeed={state.seed}
        aspect={aspect}
        canvasRefs={thumbRefs}
        disabled={off}
        onPick={setSeed}
        onMore={() => setVariantSeeds(newVariantSeeds())}
      />
    </div>
  )
}
