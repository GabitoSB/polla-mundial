import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getMatchPredictions } from '../api/matches'

const KNOCKOUT_ROUNDS = new Set([
  'Dieciseisavos', 'Octavos de Final', 'Cuartos de Final',
  'Semifinal', 'Tercer Puesto', 'Final',
])

function fmtExtraTime(v) {
  if (v === true) return 'Sí'
  if (v === false) return 'No'
  return '—'
}

function formatPredictionsError(err) {
  const status = err.response?.status
  const detail = err.response?.data?.detail
  const msg = typeof detail === 'string' ? detail : null
  if (status === 403) return msg ?? 'Las predicciones se revelan al iniciar el partido'
  if (status === 404 && msg === 'Not Found') {
    return 'No se pudo cargar: el servidor no tiene esta función actualizada.'
  }
  if (msg) return msg
  return 'No se pudieron cargar las predicciones. Intenta de nuevo.'
}

function formatMatchDate(dt) {
  return new Date(dt).toLocaleString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function sortPredictions(list, hasResult) {
  return [...list].sort((a, b) => {
    if (hasResult) return (b.points ?? -1) - (a.points ?? -1)
    return a.username.localeCompare(b.username)
  })
}

function PredictionsTable({ list, isKnockout, hasResult }) {
  if (list.length === 0) {
    return <p className="text-sm text-white/50 text-center py-8">No hay predicciones aún</p>
  }

  return (
    <div className="overflow-x-auto bg-[#111111]">
      <table className="w-full text-sm bg-[#111111]">
        <thead>
          <tr className="text-white/50 uppercase tracking-wider text-xs bg-[#1a1a1a]">
            <th className="text-left px-4 py-2.5 font-semibold w-8">#</th>
            <th className="text-left px-4 py-2.5 font-semibold">Jugador</th>
            <th className="text-center px-4 py-2.5 font-semibold">Marcador</th>
            {isKnockout && (
              <>
                <th className="text-center px-4 py-2.5 font-semibold">Penales</th>
                <th className="text-center px-4 py-2.5 font-semibold">Alargue</th>
              </>
            )}
            {hasResult && <th className="text-center px-4 py-2.5 font-semibold">Pts</th>}
          </tr>
        </thead>
        <tbody>
          {list.map((p, i) => (
            <tr
              key={p.id}
              className="bg-[#111111] even:bg-[#161616]"
              style={{ borderTop: '1px solid #252525' }}
            >
              <td className="px-4 py-2.5 text-white/25 font-medium tabular-nums">{i + 1}</td>
              <td className="px-4 py-2.5 font-medium text-white/80">{p.username}</td>
              <td className="px-4 py-2.5 text-center font-bold text-white tabular-nums">
                {p.predicted_home}–{p.predicted_away}
              </td>
              {isKnockout && (
                <>
                  <td className="px-4 py-2.5 text-center text-white/50 text-xs">
                    {p.predicted_penalty_winner ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center text-white/50 text-xs">
                    {fmtExtraTime(p.predicted_extra_time)}
                  </td>
                </>
              )}
              {hasResult && (
                <td className="px-4 py-2.5 text-center font-black text-teal-400 tabular-nums">
                  {p.points ?? 0}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PredictionsModal({ match, list, loading, error, footerNote, onClose }) {
  const isKnockout = KNOCKOUT_ROUNDS.has(match.round_name)
  const hasResult = match.home_score != null && match.away_score != null

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="predictions-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg max-h-[92vh] sm:max-h-[min(90vh,720px)] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#333] bg-[#111111]"
      >
        <div className="shrink-0 px-5 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400/80 mb-1">
                {match.match_number ? `P${match.match_number}` : 'Partido'}
                {match.round_name ? ` · ${match.round_name}` : ''}
              </p>
              <h2
                id="predictions-modal-title"
                className="text-base sm:text-lg font-bold text-white leading-snug"
              >
                {match.home_team} vs {match.away_team}
              </h2>
              <p className="text-xs text-white/40 mt-1">{formatMatchDate(match.start_time)}</p>
              {hasResult && (
                <p className="text-sm text-white/60 mt-2">
                  Resultado:{' '}
                  <span className="font-bold text-white">{match.home_score}–{match.away_score}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/40 hover:text-white text-xl leading-none p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          {!loading && !error && list.length > 0 && (
            <p className="text-xs text-white/35 mt-3">
              {list.length} predicción{list.length !== 1 ? 'es' : ''}
              {hasResult ? ' · ordenadas por puntos' : ''}
            </p>
          )}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 bg-[#111111]">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-400 text-center py-10 px-5">{error}</p>
          )}
          {!loading && !error && (
            <PredictionsTable list={list} isKnockout={isKnockout} hasResult={hasResult} />
          )}
        </div>

        <p className="shrink-0 text-[10px] text-white/40 text-center py-2.5 border-t border-[#2a2a2a] bg-[#1a1a1a]">
          {footerNote}
        </p>
      </div>
    </div>,
    document.body,
  )
}

/** Panel de solo lectura: predicciones de todos los usuarios para un partido */
export default function MatchPredictionsPanel({
  match,
  footerNote = 'Solo lectura',
  variant = 'inline',
}) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isKnockout = KNOCKOUT_ROUNDS.has(match.round_name)
  const hasResult = match.home_score != null && match.away_score != null

  const loadPredictions = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getMatchPredictions(match.id)
      setList(sortPredictions(data, hasResult))
    } catch (err) {
      setError(formatPredictionsError(err))
      setList([])
    } finally {
      setLoading(false)
    }
  }

  const openPanel = async () => {
    setOpen(true)
    await loadPredictions()
  }

  const closePanel = () => setOpen(false)

  const toggleInline = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    await loadPredictions()
  }

  if (variant === 'modal') {
    return (
      <>
        <button
          type="button"
          onClick={openPanel}
          className="w-full text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:brightness-110"
          style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#93c5fd',
          }}
        >
          Ver predicciones de jugadores
        </button>
        {open && (
          <PredictionsModal
            match={match}
            list={list}
            loading={loading}
            error={error}
            footerNote={footerNote}
            onClose={closePanel}
          />
        )}
      </>
    )
  }

  return (
    <div className="mt-3 w-full">
      <button
        type="button"
        onClick={toggleInline}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: open ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(59,130,246,0.35)' : '1px solid #2a2a2a',
          color: open ? '#93c5fd' : 'rgba(255,255,255,0.45)',
        }}
      >
        {open ? '▾ Ocultar predicciones' : '▸ Ver predicciones de usuarios'}
      </button>

      {open && (
        <div
          className="mt-2 rounded-xl overflow-hidden"
          style={{ background: '#0d0d0d', border: '1px solid #252525' }}
        >
          {loading && (
            <p className="text-xs text-white/30 text-center py-4">Cargando…</p>
          )}
          {error && (
            <p className="text-xs text-red-400 text-center py-4">{error}</p>
          )}
          {!loading && !error && (
            <PredictionsTable list={list} isKnockout={isKnockout} hasResult={hasResult} />
          )}
          <p className="text-[10px] text-white/20 text-center py-2 border-t border-white/5">
            {footerNote}
          </p>
        </div>
      )}
    </div>
  )
}
