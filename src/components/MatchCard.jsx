import { useState } from 'react'
import { createPrediction, updatePrediction } from '../api/predictions'

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      min="0"
      max="20"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className="w-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg p-2
                 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400
                 disabled:cursor-not-allowed transition-colors"
    />
  )
}

function pointsBadge(points) {
  if (points === 5) return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">+5 exacto</span>
  if (points === 3) return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">+3 ganador</span>
  if (points === 0) return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">0 pts</span>
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

  return (
    <div className={`bg-white rounded-2xl shadow-md border transition-all duration-200
      ${isLocked ? 'border-gray-200 opacity-90' : 'border-blue-100 hover:shadow-lg hover:border-blue-300'}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-t-2xl border-b border-gray-100">
        <span className="text-xs text-gray-500 font-medium">{match.round_name ?? 'Partido'}</span>
        <span className="text-xs text-gray-400">{formatDate(match.start_time)}</span>
      </div>

      {/* Teams + scores */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Home team */}
          <div className="flex-1 text-right">
            <p className="font-bold text-gray-800 text-sm sm:text-base">{match.home_team}</p>
          </div>

          {/* Score area */}
          <div className="flex items-center gap-2">
            {hasResult ? (
              /* Real result shown */
              <div className="flex items-center gap-2 bg-gray-800 text-white rounded-xl px-4 py-2">
                <span className="text-2xl font-black">{match.home_score}</span>
                <span className="text-gray-400">–</span>
                <span className="text-2xl font-black">{match.away_score}</span>
              </div>
            ) : isLocked ? (
              /* Locked, no result */
              <div className="flex items-center gap-2 text-gray-400 px-2">
                <span className="text-lg font-bold">{prediction ? `${prediction.predicted_home}–${prediction.predicted_away}` : '–'}</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Cerrado</span>
              </div>
            ) : (
              /* Open for prediction */
              <div className="flex items-center gap-2">
                <ScoreInput value={home} onChange={setHome} disabled={false} />
                <span className="text-gray-400 font-bold text-lg">–</span>
                <ScoreInput value={away} onChange={setAway} disabled={false} />
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-800 text-sm sm:text-base">{match.away_team}</p>
          </div>
        </div>

        {/* Points badge + save button */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {prediction?.points != null && pointsBadge(prediction.points)}

          {!isLocked && !hasResult && (
            <button
              onClick={handleSave}
              disabled={saving || home === '' || away === ''}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-semibold
                         px-4 py-1.5 rounded-full transition-colors"
            >
              {saving ? 'Guardando…' : saved ? '✓ Guardado' : prediction ? 'Actualizar' : 'Guardar'}
            </button>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        {/* Show user's prediction when match has a real result */}
        {hasResult && prediction && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Tu predicción: <span className="font-semibold text-gray-700">{prediction.predicted_home}–{prediction.predicted_away}</span>
            {prediction?.points != null && <span className="ml-2">{pointsBadge(prediction.points)}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
