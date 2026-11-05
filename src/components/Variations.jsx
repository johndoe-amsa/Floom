export default function Variations({ seeds, activeSeed, aspect, canvasRefs, onPick, onMore, disabled }) {
  return (
    <section className="variations" aria-label="Variations">
      <div className="variations__head">
        <h2>Variations</h2>
        <button type="button" className="btn" id="b-more" disabled={disabled} onClick={onMore}>
          Autres variations
        </button>
      </div>
      <div className="grid" style={{ '--ar': aspect }}>
        {seeds.map((seed, i) => (
          <button
            key={i}
            type="button"
            className="thumb"
            aria-pressed={seed === activeSeed ? 'true' : 'false'}
            aria-label={'Variation, graine ' + seed}
            onClick={() => onPick(seed)}
          >
            <canvas ref={(el) => { canvasRefs.current[i] = el }} />
            <span className="thumb__seed">#{seed}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
