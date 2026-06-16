import { useState } from 'react'
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

/** Panel de solo lectura: predicciones de todos los usuarios para un partido */
export default function MatchPredictionsPanel({ match, footerNote = 'Solo lectura' }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isKnockout = KNOCKOUT_ROUNDS.has(match.round_name)
  const hasResult = match.home_score != null && match.away_score != null

  const toggle = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    setError(null)
    try {
      const { data } = await getMatchPredictions(match.id)
      const sorted = [...data].sort((a, b) => {
        if (hasResult) return (b.points ?? -1) - (a.points ?? -1)
        return a.username.localeCompare(b.username)
      })
      setList(sorted)
    } catch (err) {
      setError(formatPredictionsError(err))
      setList([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 w-full">
      <button
        type="button"
        onClick={toggle}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: open ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(59,130,246,0.35)' : '1px solid #2a2a2a',
          color: open ? '#93c5fd' : 'rgba(255,255,255,0.45)',
        }}
      >
        {open ? '▾ Ocultar predicciones' : '▸ Ver predicciones de jugadores'}
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
          {!loading && !error && list.length === 0 && (
            <p className="text-xs text-white/40 text-center py-4">No hay predicciones aún</p>
          )}
          {!loading && !error && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/30 uppercase tracking-wider" style={{ background: '#161616' }}>
                    <th className="text-left px-3 py-2 font-semibold">Jugador</th>
                    <th className="text-center px-3 py-2 font-semibold">Marcador</th>
                    {isKnockout && (
                      <>
                        <th className="text-center px-3 py-2 font-semibold">Penales</th>
                        <th className="text-center px-3 py-2 font-semibold">Alargue</th>
                      </>
                    )}
                    {hasResult && <th className="text-center px-3 py-2 font-semibold">Pts</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        borderTop: '1px solid #1a1a1a',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <td className="px-3 py-2 font-medium text-white/70">{p.username}</td>
                      <td className="px-3 py-2 text-center font-bold text-white/80">
                        {p.predicted_home}–{p.predicted_away}
                      </td>
                      {isKnockout && (
                        <>
                          <td className="px-3 py-2 text-center text-white/50">
                            {p.predicted_penalty_winner ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-center text-white/50">
                            {fmtExtraTime(p.predicted_extra_time)}
                          </td>
                        </>
                      )}
                      {hasResult && (
                        <td className="px-3 py-2 text-center font-bold text-teal-400">
                          {p.points ?? 0}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] text-white/20 text-center py-2 border-t border-white/5">
            {footerNote}
          </p>
        </div>
      )}
    </div>
  )
}
