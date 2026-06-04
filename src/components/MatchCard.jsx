import { useState } from 'react'
import { createPrediction, updatePrediction } from '../api/predictions'
import { MUNDIAL_COUNTRIES } from '../constants/countries'

const isoOf = (name) => MUNDIAL_COUNTRIES.find((c) => c.name === name)?.iso ?? null

/** Renders a real flag image from flagcdn.com. Falls back to a neutral globe if unknown. */
function FlagImg({ name, size = 32 }) {
  const iso = isoOf(name)
  if (!iso) return <span className="text-2xl">🌐</span>
  return (
    <img
      src={`https://flagcdn.com/w${size}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${size * 2}/${iso}.png 2x`}
      width={size}
      alt={name}
      className="rounded-sm shadow-sm object-cover"
      style={{ height: size * 0.67 }}
    />
  )
}

/**
 * Displays a team flag + name in a fixed-width column.
 * Font size shrinks for longer names so layout stays consistent.
 */
function TeamLabel({ name, align = 'left' }) {
  const len = name?.length ?? 0
  const textSize = len > 13 ? 'text-xs' : len > 9 ? 'text-sm' : 'text-base'
  const isTBD = !name || /^(ganador|perdedor|1[°º]|2[°º]|3[°º])/i.test(name.trim())

  return (
    <div className={`w-24 flex flex-col items-center gap-1.5 ${align === 'right' ? '' : ''}`}>
      {isTBD
        ? <span className="text-2xl">❓</span>
        : <FlagImg name={name} size={40} />
      }
      <p className={`font-bold text-white/90 text-center leading-tight w-full ${textSize}`}>
        {name}
      </p>
    </div>
  )
}

function ScoreInput({ value, onChange, disabled }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2) // solo dígitos, máx 2
    onChange(raw === '' ? '' : Number(raw))
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder="–"
      className="w-12 text-center text-xl font-bold rounded-lg p-2
                 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed transition-colors
                 text-white placeholder-white/20"
      style={{ background: '#1a1a1a', border: '2px solid #333' }}
    />
  )
}

function pointsBadge(points) {
  if (points === 5) return <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold px-2 py-1 rounded-full">+5 puntos</span>
  if (points === 3) return <span className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-xs font-bold px-2 py-1 rounded-full">+3 puntos</span>
  if (points === 0) return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-2 py-1 rounded-full">0 puntos</span>
  return null
}

export default function MatchCard({ match, prediction, onSaved }) {
  const isLocked = new Date() >= new Date(match.start_time)
  const hasResult = match.home_score !== null && match.away_score !== null

  const [home, setHome] = useState(prediction?.predicted_home ?? '')
  const [away, setAway] = useState(prediction?.predicted_away ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (home === '' || away === '') return
    setSaving(true)
    setError(null)
    try {
      if (prediction) {
        await updatePrediction(prediction.id, {
          match_id: match.id,
          predicted_home: home,
          predicted_away: away,
        })
      } else {
        await createPrediction({
          match_id: match.id,
          predicted_home: home,
          predicted_away: away,
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dt) =>
    new Date(dt).toLocaleString('es-AR', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })

  const hasPrediction = !!prediction

  const points = prediction?.points
  const resultColor =
    points === 5 ? 'green' :
    points === 3 ? 'yellow' :
    points === 0 ? 'red' :
    null

  const borderCls =
    resultColor === 'green'  ? 'border-green-500/50 shadow-lg shadow-green-900/20' :
    resultColor === 'yellow' ? 'border-yellow-400/50 shadow-lg shadow-yellow-900/20' :
    resultColor === 'red'    ? 'border-red-500/40 shadow-lg shadow-red-900/20' :
    hasPrediction            ? 'border-teal-500/40 shadow-lg shadow-teal-900/20' :
    isLocked                 ? 'border-white/5 opacity-70' :
                               'border-white/8 hover:border-white/15'

  const headerBg =
    resultColor === 'green'  ? 'rgba(34,197,94,0.07)' :
    resultColor === 'yellow' ? 'rgba(234,179,8,0.07)' :
    resultColor === 'red'    ? 'rgba(239,68,68,0.07)' :
    hasPrediction            ? 'rgba(20,184,166,0.07)' :
                               '#161616'

  const headerBorderCls =
    resultColor === 'green'  ? 'border-green-500/20' :
    resultColor === 'yellow' ? 'border-yellow-400/20' :
    resultColor === 'red'    ? 'border-red-500/20' :
    hasPrediction            ? 'border-teal-500/20' :
                               'border-white/5'

  const badgeCls =
    resultColor === 'green'  ? 'bg-green-500/20 text-green-400' :
    resultColor === 'yellow' ? 'bg-yellow-400/20 text-yellow-400' :
    resultColor === 'red'    ? 'bg-red-500/20 text-red-400' :
    hasPrediction            ? 'bg-teal-500/20 text-teal-400' :
                               'bg-white/8 text-white/40'

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${borderCls}`}
      style={{ background: '#111111' }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-t-2xl border-b ${headerBorderCls}`}
        style={{ background: headerBg }}
      >
        <div className="flex items-center gap-2">
          {match.match_number && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
              P{match.match_number}
            </span>
          )}
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{match.round_name ?? 'Partido'}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasPrediction && !hasResult && (
            <span className="text-xs bg-teal-500/15 text-teal-400 border border-teal-500/20 font-semibold px-2 py-0.5 rounded-full">
              ✓ {prediction.predicted_home}–{prediction.predicted_away}
            </span>
          )}
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{formatDate(match.start_time)}</span>
        </div>
      </div>

      {/* Teams + scores */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <TeamLabel name={match.home_team} align="right" />

          <div className="flex-shrink-0 flex items-center gap-2">
            {hasResult ? (
              /* Muestra la predicción del usuario en el marcador principal */
              <div className="flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                {prediction ? (
                  <>
                    <span className="text-2xl font-black text-white">{prediction.predicted_home}</span>
                    <span className="text-white/20">–</span>
                    <span className="text-2xl font-black text-white">{prediction.predicted_away}</span>
                  </>
                ) : (
                  <span className="text-lg text-white/20 px-2">–</span>
                )}
              </div>
            ) : isLocked ? (
              <div className="flex flex-col items-center gap-1 px-2">
                <span className="text-lg font-bold text-white/40">
                  {prediction ? `${prediction.predicted_home}–${prediction.predicted_away}` : '–'}
                </span>
                <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">Cerrado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ScoreInput value={home} onChange={setHome} disabled={false} />
                <span className="text-white/20 font-bold text-lg">–</span>
                <ScoreInput value={away} onChange={setAway} disabled={false} />
              </div>
            )}
          </div>

          <TeamLabel name={match.away_team} align="left" />
        </div>

        {/* Points badge + save button */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {prediction?.points != null && pointsBadge(prediction.points)}

          {!isLocked && !hasResult && (
            <button
              onClick={handleSave}
              disabled={saving || home === '' || away === ''}
              className="text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #00c9a7, #0057ff)', boxShadow: '0 2px 12px rgba(0,180,150,0.2)' }}
            >
              {saving ? 'Guardando…' : saved ? '✓ Guardado' : hasPrediction ? 'Actualizar' : 'Guardar'}
            </button>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {/* Resultado oficial debajo */}
        {hasResult && (
          <div className="mt-2 text-center text-xs text-white/30">
            Resultado: <span className="font-semibold text-white/50">{match.home_score}–{match.away_score}</span>
          </div>
        )}
      </div>
    </div>
  )
}
