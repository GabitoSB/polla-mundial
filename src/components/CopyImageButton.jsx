function CopyIcon({ copied, error }) {
  if (copied) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (error) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export default function CopyImageButton({
  onClick,
  state = 'idle',
  variant = 'light',
  className = '',
}) {
  const copied = state === 'copied' || state === 'downloaded'
  const isError = state === 'error'
  const isDark = variant === 'dark'

  const base =
    'p-2 rounded-lg border transition-colors disabled:opacity-50 shrink-0'
  const tone = copied
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : isError
      ? 'bg-red-50 border-red-200 text-red-600'
      : isDark
        ? 'bg-white/5 border-white/15 text-white/55 hover:text-white hover:bg-white/10 hover:border-white/25'
        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'copying'}
      title={
        copied
          ? 'Imagen copiada'
          : state === 'downloaded'
            ? 'Imagen descargada'
            : isError
              ? 'Error al copiar'
              : 'Copiar como imagen'
      }
      aria-label="Copiar como imagen"
      className={`${base} ${tone} ${className}`}
    >
      <CopyIcon copied={copied} error={isError} />
    </button>
  )
}
