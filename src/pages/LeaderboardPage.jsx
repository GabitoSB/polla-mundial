import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api/leaderboard'
import { useAuth } from '../context/AuthContext'

const medals = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard()
      .then((r) => setEntries(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6 text-center">🏆 Tabla de Posiciones</h1>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>#</div>
          <div>Jugador</div>
          <div className="text-center">Pts</div>
          <div className="text-center">Exactos</div>
          <div className="text-center">Parciales</div>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📊</p>
            <p>Aún no hay puntuaciones</p>
          </div>
        )}

        {entries.map((entry, idx) => {
          const isMe = entry.username === user.username
          return (
            <div
              key={entry.user_id}
              className={`grid grid-cols-[2rem_1fr_4rem_4rem_4rem] gap-2 px-4 py-3 border-b border-gray-100 items-center
                ${isMe ? 'bg-blue-50 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                ${idx < 3 ? 'text-base' : 'text-sm'}
              `}
            >
              <div className="text-center font-bold text-gray-500">
                {idx < 3 ? medals[idx] : entry.rank}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${isMe ? 'bg-blue-600' : 'bg-gray-400'}`}>
                  {entry.username[0].toUpperCase()}
                </div>
                <span className={isMe ? 'text-blue-700' : 'text-gray-800'}>
                  {entry.username}
                  {isMe && <span className="ml-1 text-xs text-blue-400">(vos)</span>}
                </span>
              </div>
              <div className="text-center font-black text-blue-700 text-lg">{entry.total_points}</div>
              <div className="text-center text-green-600 font-semibold">{entry.exact_results}</div>
              <div className="text-center text-gray-500">{entry.partial_score_hits}</div>
            </div>
          )
        })}
      </div>

      {entries.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Desempate: Puntos → Exactos → Parciales
        </p>
      )}
    </div>
  )
}
