const OPTIONS = [
  { key: 'chronological', label: 'Por fecha' },
  { key: 'byGroup', label: 'Por grupo' },
]

export default function ViewLayoutToggle({ value, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-on-dark-muted uppercase tracking-widest">Vista</span>
      <div
        className="flex rounded-xl p-0.5"
        style={{ background: '#111111', border: '1px solid #222' }}
      >
        {OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              value === key ? 'text-white' : 'text-on-dark-muted hover:text-on-dark'
            }`}
            style={value === key ? { background: 'linear-gradient(135deg,#00c9a7,#0057ff)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
