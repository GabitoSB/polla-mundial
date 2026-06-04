import { useState } from 'react'
import { createPrediction, updatePrediction } from '../api/predictions'
import { MUNDIAL_COUNTRIES } from '../constants/countries'

const KNOCKOUT_ROUNDS = new Set([
  'Dieciseisavos', 'Octavos de Final', 'Cuartos de Final',
  'Semifinal', 'Tercer Puesto', 'Final',
])

const isoOf = (name) => MUNDIAL_COUNTRIES.find((c) => c.name === name)?.iso ?? null

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

/** Placeholder con marco tipo bandera para equipos aún no definidos */
function TBDFlag({ size = 40 }) {
  const height = Math.round(size * 0.67)
  return (
    <div
      className="flex items-center justify-center rounded-sm border border-white/25 bg-white/[0.04] shadow-sm"
      style={{ width: size, height }}
      aria-label="Por definir"
    >
      <span className="text-[6px] font-bold uppercase text-white/40 text-center leading-[1.15] tracking-wide px-0.5">
        POR
        <br />
        DEFINIR
      </span>
    </div>
  )
}

function TeamLabel({ name }) {
  const len = name?.length ?? 0
  const textSize = len > 13 ? 'text-xs' : len > 9 ? 'text-sm' : 'text-base'
  const isTBD = !name || /^(ganador|perdedor|1[°º]|2[°º]|3[°º])/i.test(name.trim())

  return (
    <div className="w-24 flex flex-col items-center gap-1.5">
      {isTBD ? <TBDFlag size={40} /> : <FlagImg name={name} size={40} />}
      <p className={`font-bold text-white/90 text-center leading-tight w-full ${textSize}`}>
        {name}
      </p>
    </div>
  )
}

function ScoreInput({ value, onChange, disabled }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
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

/** Extra time toggle — shown in all knockout matches */
function ExtraTimePicker({ value, onChange }) {
  return (
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
        ¿Habrá alargue?
      </p>
      <div className="flex gap-2">
        {[true, false].map((opt) => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(value === opt ? null : opt)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: value === opt ? 'rgba(251,191,36,0.2)' : '#1a1a1a',
              border: value === opt ? '1px solid rgba(251,191,36,0.5)' : '1px solid #2a2a2a',
              color: value === opt ? '#fbbf24' : 'rgba(255,255,255,0.35)',
            }}
          >
            {opt ? 'Sí' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Penalty winner selector — shown in knockout matches when predicted score is a draw */
function PenaltyPicker({ homeTeam, awayTeam, value, onChange }) {
  const isTBD = (t) => !t || /^(ganador|perdedor|1[°º]|2[°º]|3[°º])/i.test(t.trim())
  if (isTBD(homeTeam) || isTBD(awayTeam)) return null

  return (
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
        ¿Quién pasa por penales?
      </p>
      <div className="flex gap-2">
        {[homeTeam, awayTeam].map((team) => (
          <button
            key={team}
            type="button"
            onClick={() => onChange(value === team ? null : team)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: value === team ? 'rgba(20,184,166,0.2)' : '#1a1a1a',
              border: value === team ? '1px solid rgba(20,184,166,0.5)' : '1px solid #2a2a2a',
              color: value === team ? '#2dd4bf' : 'rgba(255,255,255,0.4)',
            }}
          >
            <FlagImg name={team} size={16} />
            {team}
          </button>
        ))}
      </div>
    </div>
  )
}

function pointsBadge(points) {
  if (points == null) return null
  const color =
    points >= 8 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
    points >= 5 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
    points >= 3 ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
  return (
    <span className={`border text-xs font-bold px-2 py-1 rounded-full ${color}`}>
      +{points} puntos
    </span>
  )
}

export default function MatchCard({ match, prediction, onSaved }) {
  const isLocked = new Date() >= new Date(match.start_time)
  const hasResult = match.home_score !== null && match.away_score !== null
  const isKnockout = KNOCKOUT_ROUNDS.has(match.round_name)

  const [home, setHome] = useState(prediction?.predicted_home ?? '')
  const [away, setAway] = useState(prediction?.predicted_away ?? '')
  const [penaltyWinner, setPenaltyWinner] = useState(prediction?.predicted_penalty_winner ?? null)
  const [extraTime, setExtraTime] = useState(prediction?.predicted_extra_time ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  // Show penalty picker when: knockout round + both scores filled + draw predicted
  const showPenaltyPicker = isKnockout && home !== '' && away !== '' && Number(home) === Number(away)

  // Clear penalty winner if scores are no longer a draw
  const handleHomeChange = (v) => { setHome(v); if (Number(v) !== Number(away)) setPenaltyWinner(null) }
  const handleAwayChange = (v) => { setAway(v); if (Number(home) !== Number(v)) setPenaltyWinner(null) }

  const handleSave = async () => {
    if (home === '' || away === '') return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        match_id: match.id,
        predicted_home: home,
        predicted_away: away,
        predicted_penalty_winner: showPenaltyPicker ? penaltyWinner : null,
        predicted_extra_time: isKnockout ? extraTime : null,
      }
      if (prediction) {
        await updatePrediction(prediction.id, payload)
      } else {
        await createPrediction(payload)
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
    new Date(dt).toLocaleString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })

  const hasPrediction = !!prediction
  const points = prediction?.points
  const resultColor =
    points >= 5 ? 'green' :
    points === 3 || points === 4 ? 'yellow' :
    points === 0 ? 'red' : null

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
    hasPrediction            ? 'rgba(20,184,166,0.07)' : '#161616'

  const headerBorderCls =
    resultColor === 'green'  ? 'border-green-500/20' :
    resultColor === 'yellow' ? 'border-yellow-400/20' :
    resultColor === 'red'    ? 'border-red-500/20' :
    hasPrediction            ? 'border-teal-500/20' : 'border-white/5'

  const badgeCls =
    resultColor === 'green'  ? 'bg-green-500/20 text-green-400' :
    resultColor === 'yellow' ? 'bg-yellow-400/20 text-yellow-400' :
    resultColor === 'red'    ? 'bg-red-500/20 text-red-400' :
    hasPrediction            ? 'bg-teal-500/20 text-teal-400' : 'bg-white/8 text-white/40'

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${borderCls}`}
      style={{ background: '#111111' }}
    >
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 rounded-t-2xl border-b ${headerBorderCls}`}
        style={{ background: headerBg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {match.match_number && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeCls}`}>
              P{match.match_number}
            </span>
          )}
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide truncate">
            {match.round_name ?? 'Partido'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {hasPrediction && !hasResult && (
            <span className="text-xs bg-teal-500/15 text-teal-400 border border-teal-500/20 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
              ✓ {prediction.predicted_home}–{prediction.predicted_away}
              {prediction.predicted_penalty_winner && ` (${prediction.predicted_penalty_winner})`}
            </span>
          )}
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide whitespace-nowrap">
            {formatDate(match.start_time)}
          </span>
        </div>
      </div>

      {/* Teams + scores */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <TeamLabel name={match.home_team} />

          <div className="flex-shrink-0 flex items-center gap-2">
            {hasResult ? (
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
                <ScoreInput value={home} onChange={handleHomeChange} />
                <span className="text-white/20 font-bold text-lg">–</span>
                <ScoreInput value={away} onChange={handleAwayChange} />
              </div>
            )}
          </div>

          <TeamLabel name={match.away_team} />
        </div>

        {/* Extra time toggle (knockout matches, only while open) */}
        {!isLocked && !hasResult && isKnockout && (
          <ExtraTimePicker value={extraTime} onChange={setExtraTime} />
        )}

        {/* Penalty picker (only when predicting a draw in knockout) */}
        {!isLocked && !hasResult && showPenaltyPicker && (
          <PenaltyPicker
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            value={penaltyWinner}
            onChange={setPenaltyWinner}
          />
        )}

        {/* Points badge + save button */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {points != null && pointsBadge(points)}

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

        {/* Resultado oficial + ganador por penales */}
        {hasResult && (
          <div className="mt-2 text-center text-xs text-white/30">
            Resultado: <span className="font-semibold text-white/50">{match.home_score}–{match.away_score}</span>
            {match.penalty_winner && (
              <span className="ml-2 text-amber-400/70">· Penales: <span className="font-semibold">{match.penalty_winner}</span></span>
            )}
          </div>
        )}

        {/* Predicted penalty winner display (after result) */}
        {hasResult && prediction?.predicted_penalty_winner && match.home_score === match.away_score && (
          <div className="mt-1 text-center text-xs text-white/25">
            Tu penales: <span className={`font-semibold ${prediction.predicted_penalty_winner === match.penalty_winner ? 'text-amber-400' : 'text-white/30'}`}>
              {prediction.predicted_penalty_winner}
            </span>
          </div>
        )}

        {/* Extra time prediction display (after result for knockout matches) */}
        {hasResult && isKnockout && prediction && match.has_extra_time !== null && match.has_extra_time !== undefined && (
          <div className="mt-1 text-center text-xs text-white/25">
            Alargue: tu predicción{' '}
            <span className={`font-semibold ${prediction.predicted_extra_time === match.has_extra_time ? 'text-amber-400' : 'text-white/30'}`}>
              {prediction.predicted_extra_time === true ? 'Sí' : prediction.predicted_extra_time === false ? 'No' : '—'}
            </span>
            {' · '}real{' '}
            <span className="font-semibold text-white/50">
              {match.has_extra_time ? 'Sí' : 'No'}
            </span>
            {prediction.predicted_extra_time === match.has_extra_time && (
              <span className="text-amber-400"> · +2 pts</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
