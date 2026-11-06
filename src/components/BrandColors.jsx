import { useEffect, useState } from 'react'
import { MAX_BRAND_COLORS, BRAND_SLIDERS } from '../data'
import { parseColor, hexToRgb255 } from '../lib/color'
import RangeField from './RangeField'

function HexInput({ id, value, onCommit, disabled, label }) {
  const [text, setText] = useState(value)
  const [invalid, setInvalid] = useState(false)
  useEffect(() => { setText(value); setInvalid(false) }, [value])

  const onInput = (e) => {
    setText(e.target.value)
    const c = parseColor(e.target.value)
    setInvalid(!c && e.target.value.trim() !== '')
    if (c && c !== value) onCommit(c)
  }
  const onBlur = () => { setText(value); setInvalid(false) }

  return (
    <input
      type="text"
      id={id}
      className="hex"
      aria-label={label}
      aria-invalid={invalid ? 'true' : 'false'}
      spellCheck="false"
      autoComplete="off"
      autoCapitalize="characters"
      placeholder="#1B5FC2 ou 27, 95, 194"
      value={text}
      disabled={disabled}
      onChange={onInput}
      onBlur={onBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}

export default function BrandColors({ brand, onChange, disabled }) {
  const { colors } = brand
  const total = colors.reduce((s, c) => s + c.weight, 0) || 1
  const single = colors.length === 1

  const setColor = (i, patch) => {
    const next = colors.map((c, j) => (j === i ? { ...c, ...patch } : c))
    onChange({ colors: next })
  }
  const remove = (i) => onChange({ colors: colors.filter((_, j) => j !== i) })
  const move = (i, d) => {
    const next = colors.slice()
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange({ colors: next })
  }
  const add = () => {
    const avg = Math.round(total / colors.length) || 50
    onChange({ colors: [...colors, { hex: colors[colors.length - 1]?.hex || '#FFFFFF', weight: avg }] })
  }

  return (
    <>
      <div className="group" role="group" aria-labelledby="l-brand">
        <div className="field__row">
          <span className="label" id="l-brand">Couleurs de marque</span>
          <span className="hint">{colors.length} / {MAX_BRAND_COLORS}</span>
        </div>

        <div className="share" aria-hidden="true">
          {colors.map((c, i) => <span key={i} style={{ background: c.hex, flexGrow: c.weight }} />)}
        </div>

        <ol className="brand-list">
          {colors.map((c, i) => {
            const share = Math.round((c.weight / total) * 100)
            const [r, g, b] = hexToRgb255(c.hex)
            return (
              <li key={i} className="brand-item">
                <div className="brand-item__row">
                  <input
                    type="color"
                    className="swatch"
                    aria-label={'Couleur ' + (i + 1)}
                    value={c.hex.toLowerCase()}
                    disabled={disabled}
                    onChange={(e) => setColor(i, { hex: e.target.value.toUpperCase() })}
                  />
                  <div className="brand-item__code">
                    <HexInput
                      id={'b-hex-' + i}
                      label={'Code de la couleur ' + (i + 1) + ' (hex ou RGB)'}
                      value={c.hex}
                      disabled={disabled}
                      onCommit={(hex) => setColor(i, { hex })}
                    />
                    <span className="rgb">R {r} · V {g} · B {b}</span>
                  </div>
                  <div className="brand-item__tools">
                    <button type="button" className="icon-btn" aria-label={'Monter la couleur ' + (i + 1)} disabled={disabled || i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button type="button" className="icon-btn" aria-label={'Descendre la couleur ' + (i + 1)} disabled={disabled || i === colors.length - 1} onClick={() => move(i, 1)}>↓</button>
                    <button type="button" className="icon-btn" aria-label={'Supprimer la couleur ' + (i + 1)} disabled={disabled || single} onClick={() => remove(i)}>×</button>
                  </div>
                </div>
                {!single && (
                  <div className="field">
                    <div className="field__row">
                      <label htmlFor={'b-w-' + i}>Prédominance</label>
                      <output htmlFor={'b-w-' + i}>{share} %</output>
                    </div>
                    <input
                      type="range"
                      id={'b-w-' + i}
                      min="1"
                      max="100"
                      step="1"
                      value={c.weight}
                      disabled={disabled}
                      onChange={(e) => setColor(i, { weight: parseInt(e.target.value, 10) })}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <button type="button" className="btn" disabled={disabled || colors.length >= MAX_BRAND_COLORS} onClick={add}>
          + Ajouter une couleur
        </button>
      </div>

      <div className="group">
        <span className="label">Fidélité</span>
        {BRAND_SLIDERS.filter((sl) => !(single && sl.key === 'softness')).map((sl) => (
          <RangeField
            key={sl.key}
            id={'b-' + sl.key}
            {...sl}
            value={brand[sl.key]}
            disabled={disabled}
            onChange={(v) => onChange({ [sl.key]: v })}
          />
        ))}
        <p className="hint">
          À 0 % d’écart, seules les couleurs saisies (et leurs fondus) apparaissent. Pour des codes strictement exacts, mettez aussi les traînées de lumière et le grain à 0.
        </p>
      </div>
    </>
  )
}
