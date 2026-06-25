import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboardHistory } from '../api/leaderboard'
import LeaderboardChart from '../components/LeaderboardChart'
import { useAuth } from '../context/AuthContext'

export default function RankingEvolutionPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboardHistory()
      .then((r) => setHistory(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen stadium-bg"
      style={{
        backgroundImage: 'url(/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="min-h-screen" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                Evolución del ranking
              </h1>
              <p className="text-sm text-white/55 mt-1 max-w-xl">
                Sigue cómo cambia la posición de cada jugador tras cada partido con resultado.
              </p>
            </div>
            <Link
              to="/leaderboard"
              className="self-start sm:self-auto text-sm font-semibold text-white/80 hover:text-white px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
            >
              Ver tabla tradicional →
            </Link>
          </div>

          <LeaderboardChart history={history} currentUserId={user?.id} />
        </div>
      </div>
    </div>
  )
}
