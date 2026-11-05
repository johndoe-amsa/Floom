export default function RangeField({ id, label, min, max, step, decimals, unit = '', value, onChange, disabled }) {
  return (
    <div className="field">
      <div className="field__row">
        <label htmlFor={'r-' + id}>{label}</label>
        <output id={'o-' + id} htmlFor={'r-' + id}>{Number(value).toFixed(decimals) + unit}</output>
      </div>
      <input
        type="range"
        id={'r-' + id}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}
