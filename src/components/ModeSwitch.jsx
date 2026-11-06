const MODES = [
  { id: 'palette', label: 'Palettes' },
  { id: 'brand', label: 'Couleurs de marque' },
]

export default function ModeSwitch({ mode, onChange, disabled }) {
  return (
    <div className="segmented" role="group" aria-label="Mode de couleur">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={mode === m.id ? 'true' : 'false'}
          disabled={disabled}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
