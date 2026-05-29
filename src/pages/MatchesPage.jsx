import { useEffect, useState } from 'react'
import { getMatches } from '../api/matches'
import { getMyPredictions } from '../api/predictions'
import MatchCard from '../components/MatchCard'
import { useAuth } from '../context/AuthContext'

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [matchRes, predRes] = await Promise.all([getMatches(), getMyPredictions()])
      setMatches(matchRes.data)
      // Index predictions by match_id for O(1) lookup
      const predMap = {}
      predRes.data.forEach((p) => { predMap[p.match_id] = p })
      setPredictions(predMap)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Split matches into upcoming and finished
  const upcoming = matches.filter((m) => new Date() < new Date(m.start_time))
  const ongoing  = matches.filter((m) => new Date() >= new Date(m.start_time) && m.home_score === null)
  const finished = matches.filter((m) => m.home_score !== null)

  const Section = ({ title, items, emptyText }) =>
    items.length === 0 ? null : (
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">{title}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predictions[m.id] ?? null}
              onSaved={load}
            />
          ))}
        </div>
      </section>
    )

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Stats bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-4 mb-8 flex flex-wrap gap-6 items-center justify-between text-white">
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Tus puntos</p>
          <p className="text-4xl font-black">{user.total_points}</p>
        </div>
        <div className="text-center">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Exactos</p>
          <p className="text-3xl font-bold">{user.exact_results}</p>
        </div>
        <div className="text-center">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Parciales</p>
          <p className="text-3xl font-bold">{user.partial_score_hits}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Partidos predichos</p>
          <p className="text-3xl font-bold">{Object.keys(predictions).length}</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-medium">Aún no hay partidos cargados</p>
          <p className="text-sm mt-1">El admin debe agregar los partidos del torneo</p>
        </div>
      ) : (
        <>
          <Section title="Próximos partidos" items={upcoming} />
          <Section title="En curso / sin resultado" items={ongoing} />
          <Section title="Partidos finalizados" items={finished} />
        </>
      )}
    </div>
  )
}
