export default function ColorSwatches({ colors, onChange, disabled }) {
  return (
    <div className="group" role="group" aria-labelledby="l-colors">
      <span className="label" id="l-colors">Couleurs</span>
      <div className="swatches">
        {colors.map((c, i) => (
          <input
            key={i}
            type="color"
            id={'c-' + i}
            aria-label={'Couleur ' + (i + 1)}
            value={c}
            disabled={disabled}
            onChange={(e) => onChange(i, e.target.value)}
          />
        ))}
      </div>
    </div>
  )
}
