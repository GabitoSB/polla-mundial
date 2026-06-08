import { useState } from 'react'
import { createPrediction, updatePrediction } from '../api/predictions'
import { MUNDIAL_COUNTRIES } from '../constants/countries'

const KNOCKOUT_ROUNDS = new Set([
  'Dieciseisavos', 'Octavos de Final', 'Cuartos de Final',
  'Semifinal', 'Tercer Puesto', 'Final',
])

const isoOf = (name) => MUNDIAL_COUNTRIES.find((c) => c.name === name)?.iso ?? null

const isTBDTeam = (name) => !name || /^(ganador|perdedor|1[°º]|2[°º]|3[°º])/i.test(name.trim())

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
      <span className="text-[6px] font-bold uppercase text-on-dark-muted text-center leading-[1.15] tracking-wide px-0.5">
        POR
        <br />
        DEFINIR
      </span>
    </div>
  )
}

function TeamLabel({ name, selectable, selected, onSelect }) {
  const len = name?.length ?? 0
  const textSize = len > 13 ? 'text-sm' : len > 9 ? 'text-base' : 'text-lg'
  const isTBD = isTBDTeam(name)

  const inner = (
    <>
      <div className="relative">
        <div
          className={`rounded-sm transition-all ${
            selected
              ? 'ring-2 ring-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.25)]'
              : selectable
                ? 'ring-1 ring-transparent hover:ring-white/20'
                : ''
          }`}
        >
          {isTBD ? <TBDFlag size={40} /> : <FlagImg name={name} size={40} />}
        </div>
        {selected && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wide bg-teal-400 text-black px-1.5 py-px rounded-sm whitespace-nowrap">
            Penales
          </span>
        )}
      </div>
      <p className={`font-bold text-center leading-tight w-full ${textSize} ${selected ? 'text-teal-300' : 'text-white/90'}`}>
        {name}
      </p>
    </>
  )

  if (!selectable) {
    return (
      <div className="w-full max-w-[6.5rem] sm:w-24 flex flex-col items-center gap-1.5">
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full max-w-[6.5rem] sm:w-24 flex flex-col items-center gap-1.5 rounded-lg p-1 -m-1 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-500/50"
      aria-pressed={selected}
      aria-label={`${name}${selected ? ', pasa por penales' : ', elegir para penales'}`}
    >
      {inner}
    </button>
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
      className="w-16 sm:w-14 text-center text-2xl font-bold rounded-lg p-2
                 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed transition-colors
                 text-white placeholder-white/20"
      style={{ background: '#1a1a1a', border: '2px solid #333' }}
    />
  )
}

/** Extra time toggle — inline row for knockout matches */
function ExtraTimePicker({ value, onChange, locked = false }) {
  const display = locked ? true : value

  return (
    <div className="mt-2 flex items-center justify-center gap-2">
      <span className="text-xs font-bold text-on-dark-muted uppercase tracking-wider shrink-0">
        Alargue
      </span>
      <div className="flex gap-1.5">
        {[true, false].map((opt) => (
          <button
            key={String(opt)}
            type="button"
            disabled={locked}
            onClick={() => !locked && onChange(value === opt ? null : opt)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-bold transition-all min-w-[3rem] ${
              locked ? 'cursor-not-allowed' : ''
            }`}
            style={{
              background: display === opt ? 'rgba(251,191,36,0.2)' : '#1a1a1a',
              border: display === opt ? '1px solid rgba(251,191,36,0.5)' : '1px solid #2a2a2a',
              color: display === opt ? '#fbbf24' : 'rgba(255,255,255,0.65)',
              opacity: locked && display !== opt ? 0.4 : 1,
            }}
          >
            {opt ? 'Sí' : 'No'}
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
    <span className={`border text-sm font-bold px-2.5 py-1 rounded-full ${color}`}>
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

  const predictedDraw = home !== '' && away !== '' && Number(home) === Number(away)
  const showPenaltyPicker = isKnockout && predictedDraw

  const handleHomeChange = (v) => {
    setHome(v)
    if (v === '' || away === '' || Number(v) !== Number(away)) {
      setPenaltyWinner(null)
      if (v !== '' && away !== '' && Number(v) !== Number(away)) setExtraTime(null)
    }
  }
  const handleAwayChange = (v) => {
    setAway(v)
    if (v === '' || home === '' || Number(home) !== Number(v)) {
      setPenaltyWinner(null)
      if (home !== '' && v !== '' && Number(home) !== Number(v)) setExtraTime(null)
    }
  }

  const canSave = home !== '' && away !== '' && (
    !isKnockout || (
      predictedDraw ? !!penaltyWinner : extraTime !== null
    )
  )

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
        predicted_extra_time: isKnockout ? (predictedDraw ? true : extraTime) : null,
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
    hasPrediction            ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-on-dark-muted'

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${borderCls}`}
      style={{ background: '#111111' }}
    >
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-1 sm:gap-x-3 sm:gap-y-1 px-3 sm:px-4 py-2 rounded-t-2xl border-b ${headerBorderCls}`}
        style={{ background: headerBg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {match.match_number && (
            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${badgeCls}`}>
              P{match.match_number}
            </span>
          )}
          <span className="text-sm font-semibold text-on-dark-muted uppercase tracking-wide truncate">
            {match.round_name ?? 'Partido'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto flex-wrap">
          <span className="text-sm font-semibold text-on-dark-muted uppercase tracking-wide whitespace-nowrap">
            {formatDate(match.start_time)}
          </span>
        </div>
      </div>

      {/* Teams + scores */}
      <div className="px-3 sm:px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
          <TeamLabel
            name={match.home_team}
            selectable={!isLocked && !hasResult && showPenaltyPicker}
            selected={penaltyWinner === match.home_team}
            onSelect={() => setPenaltyWinner(penaltyWinner === match.home_team ? null : match.home_team)}
          />

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
                <span className="text-lg font-bold text-on-dark-muted">
                  {prediction ? `${prediction.predicted_home}–${prediction.predicted_away}` : '–'}
                </span>
                <span className="text-sm bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-full">Cerrado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ScoreInput value={home} onChange={handleHomeChange} />
                <span className="text-white/20 font-bold text-lg">–</span>
                <ScoreInput value={away} onChange={handleAwayChange} />
              </div>
            )}
          </div>

          <TeamLabel
            name={match.away_team}
            selectable={!isLocked && !hasResult && showPenaltyPicker}
            selected={penaltyWinner === match.away_team}
            onSelect={() => setPenaltyWinner(penaltyWinner === match.away_team ? null : match.away_team)}
          />
        </div>

        {!isLocked && !hasResult && isKnockout && (
          <ExtraTimePicker
            value={predictedDraw ? true : extraTime}
            onChange={setExtraTime}
            locked={predictedDraw}
          />
        )}

        {/* Points badge + save button */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {points != null && pointsBadge(points)}

          {!isLocked && !hasResult && (
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className="text-white text-base font-semibold px-5 py-2.5 rounded-full transition-all disabled:opacity-30 min-h-[44px]"
              style={{ background: 'linear-gradient(135deg, #00c9a7, #0057ff)', boxShadow: '0 2px 12px rgba(0,180,150,0.2)' }}
            >
              {saving ? 'Guardando…' : saved ? '✓ Guardado' : hasPrediction ? 'Actualizar' : 'Guardar'}
            </button>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Resultado oficial + ganador por penales */}
        {hasResult && (
          <div className="mt-2 text-center text-sm text-on-dark-muted">
            Resultado: <span className="font-semibold text-on-dark">{match.home_score}–{match.away_score}</span>
            {match.penalty_winner && (
              <span className="ml-2 text-amber-400/70">· Penales: <span className="font-semibold">{match.penalty_winner}</span></span>
            )}
          </div>
        )}

        {/* Predicted penalty winner display (after result) */}
        {hasResult && prediction?.predicted_penalty_winner && match.home_score === match.away_score && (
          <div className="mt-1 text-center text-sm text-on-dark-muted">
            Tu penales: <span className={`font-semibold ${prediction.predicted_penalty_winner === match.penalty_winner ? 'text-amber-400' : 'text-on-dark-subtle'}`}>
              {prediction.predicted_penalty_winner}
            </span>
          </div>
        )}

        {/* Extra time prediction display (after result for knockout matches) */}
        {hasResult && isKnockout && prediction && prediction.predicted_extra_time !== null && match.has_extra_time !== null && match.has_extra_time !== undefined && (
          <div className="mt-1 text-center text-sm text-on-dark-muted">
            Alargue: tu predicción{' '}
            <span className={`font-semibold ${prediction.predicted_extra_time === match.has_extra_time ? 'text-amber-400' : 'text-on-dark-subtle'}`}>
              {prediction.predicted_extra_time === true ? 'Sí' : prediction.predicted_extra_time === false ? 'No' : '—'}
            </span>
            {' · '}real{' '}
            <span className="font-semibold text-on-dark">
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
