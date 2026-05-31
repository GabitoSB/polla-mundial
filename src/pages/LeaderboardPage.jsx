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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
      </div>
    )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white mb-6 text-center">🏆 Tabla de Posiciones</h1>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem] gap-2 px-4 py-3 text-xs font-semibold text-white/25 uppercase tracking-widest"
          style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
          <div>#</div>
          <div>Jugador</div>
          <div className="text-center">Pts</div>
          <div className="text-center">Exactos</div>
          <div className="text-center">Parciales</div>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12 text-white/25">
            <p className="text-4xl mb-2">📊</p>
            <p>Aún no hay puntuaciones</p>
          </div>
        )}

        {entries.map((entry, idx) => {
          const isMe = entry.username === user.username
          return (
            <div
              key={entry.user_id}
              className={`grid grid-cols-[2rem_1fr_4rem_4rem_4rem] gap-2 px-4 py-3 items-center transition-colors
                ${idx < 3 ? 'text-base' : 'text-sm'}
              `}
              style={{
                borderBottom: '1px solid #1a1a1a',
                background: isMe ? 'rgba(0,180,150,0.07)' : 'transparent',
              }}
            >
              <div className="text-center font-bold text-white/30">
                {idx < 3 ? medals[idx] : entry.rank}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: isMe ? 'linear-gradient(135deg,#00c9a7,#0057ff)' : '#2a2a2a' }}>
                  {entry.username[0].toUpperCase()}
                </div>
                <span className={isMe ? 'text-teal-400 font-semibold' : 'text-white/60'}>
                  {entry.username}
                  {isMe && <span className="ml-1 text-xs text-teal-500/60">(tú)</span>}
                </span>
              </div>
              <div className="text-center font-black text-white text-lg">{entry.total_points}</div>
              <div className="text-center text-green-400 font-semibold">{entry.exact_results}</div>
              <div className="text-center text-white/30">{entry.partial_score_hits}</div>
            </div>
          )
        })}
      </div>

      {entries.length > 0 && (
        <p className="text-center text-xs text-white/20 mt-4">
          Desempate: Puntos → Exactos → Parciales
        </p>
      )}
    </div>
  )
}
