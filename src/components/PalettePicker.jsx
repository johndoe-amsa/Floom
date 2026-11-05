import { PALETTES } from '../data'

export default function PalettePicker({ activeIndex, onSelect, disabled }) {
  return (
    <div className="group" role="group" aria-labelledby="l-palettes">
      <span className="label" id="l-palettes">Palettes</span>
      <div className="palettes">
        {PALETTES.map((p, i) => (
          <button
            key={p.name}
            type="button"
            className="palette"
            aria-label={'Palette ' + p.name}
            title={p.name}
            aria-pressed={i === activeIndex ? 'true' : 'false'}
            disabled={disabled}
            onClick={() => onSelect(i)}
          >
            {p.colors.map((c, j) => <span key={j} style={{ background: c }} />)}
          </button>
        ))}
      </div>
    </div>
  )
}
