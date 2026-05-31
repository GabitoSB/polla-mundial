import { useEffect, useState } from 'react'
import { getMatches } from '../api/matches'
import { getMyPredictions } from '../api/predictions'
import MatchCard from '../components/MatchCard'
import { useAuth } from '../context/AuthContext'

// ── Phase definitions (order matters) ────────────────────────────────────────

const PHASES = [
  {
    key: 'grupos',
    label: 'Grupos',
    icon: '🏟️',
    test: (r) => r && r.startsWith('Grupo '),
  },
  {
    key: 'dieciseisavos',
    label: 'Dieciseisavos',
    icon: '32️⃣',
    test: (r) => r === 'Dieciseisavos',
  },
  {
    key: 'octavos',
    label: 'Octavos',
    icon: '16️⃣',
    test: (r) => r === 'Octavos de Final',
  },
  {
    key: 'cuartos',
    label: 'Cuartos',
    icon: '⚡',
    test: (r) => r === 'Cuartos de Final',
  },
  {
    key: 'semis',
    label: 'Semis',
    icon: '🔥',
    test: (r) => r === 'Semifinal',
  },
  {
    key: 'final',
    label: 'Final',
    icon: '🏆',
    test: (r) => r === 'Tercer Puesto' || r === 'Final',
  },
]

// Group order for the groups phase
const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// ── Component ─────────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState('grupos')

  const load = async () => {
    try {
      const [matchRes, predRes] = await Promise.all([getMatches(), getMyPredictions()])
      setMatches(matchRes.data)
      const predMap = {}
      predRes.data.forEach((p) => { predMap[p.match_id] = p })
      setPredictions(predMap)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Count matches per phase (for badges)
  const countForPhase = (phase) =>
    matches.filter((m) => phase.test(m.round_name)).length

  // Get matches for current phase
  const phaseMatches = matches.filter((m) => {
    const phase = PHASES.find((p) => p.key === activePhase)
    return phase ? phase.test(m.round_name) : false
  })

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Stats bar */}
      <div className="rounded-2xl p-4 mb-6 flex flex-wrap gap-6 items-center justify-between"
        style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
        <div>
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-1">Tus puntos</p>
          <p className="text-4xl font-black text-white">{user.total_points}</p>
        </div>
        <div className="text-center">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-1">Exactos</p>
          <p className="text-3xl font-bold text-green-400">{user.exact_results}</p>
        </div>
        <div className="text-center">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-1">Parciales</p>
          <p className="text-3xl font-bold text-teal-400">{user.partial_score_hits}</p>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-1">Predicciones</p>
          <p className="text-3xl font-bold text-white/70">{Object.keys(predictions).length}</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-medium">Aún no hay partidos cargados</p>
          <p className="text-sm mt-1">El admin debe agregar los partidos del torneo</p>
        </div>
      ) : (
        <>
          {/* Phase tabs */}
          <div className="overflow-x-auto pb-1 mb-6">
            <div className="flex gap-2 min-w-max">
              {PHASES.map((phase) => {
                const count = countForPhase(phase)
                if (count === 0) return null
                const isActive = activePhase === phase.key
                return (
                  <button
                    key={phase.key}
                    onClick={() => setActivePhase(phase.key)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                    style={isActive
                      ? { background: 'linear-gradient(135deg,#00c9a7,#0057ff)', color: '#fff', boxShadow: '0 2px 12px rgba(0,180,150,0.25)' }
                      : { background: '#111111', color: 'rgba(255,255,255,0.4)', border: '1px solid #222' }
                    }
                  >
                    <span>{phase.icon}</span>
                    <span>{phase.label}</span>
                    <span className="text-xs rounded-full px-1.5 py-0.5 font-bold"
                      style={isActive ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: '#1e1e1e', color: 'rgba(255,255,255,0.3)' }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {activePhase === 'grupos' ? (
            <GroupsView matches={phaseMatches} predictions={predictions} onSaved={load} />
          ) : (
            <PhaseView matches={phaseMatches} predictions={predictions} onSaved={load} />
          )}
        </>
      )}
    </div>
  )
}

// ── Groups view: sub-sections per group ───────────────────────────────────────

function GroupsView({ matches, predictions, onSaved }) {
  const byGroup = GROUP_ORDER.reduce((acc, letter) => {
    const g = matches.filter((m) => m.round_name === `Grupo ${letter}`)
    if (g.length > 0) acc[letter] = g
    return acc
  }, {})

  if (Object.keys(byGroup).length === 0)
    return <EmptyPhase />

  return (
    <div className="space-y-8">
      {Object.entries(byGroup).map(([letter, groupMatches]) => (
        <section key={letter}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full text-white text-sm font-black flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00c9a7,#0057ff)' }}>
              {letter}
            </div>
            <h2 className="text-base font-bold text-white/70">Grupo {letter}</h2>
            <div className="flex-1 h-px" style={{ background: '#1e1e1e' }} />
            <GroupProgress matches={groupMatches} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predictions[m.id] ?? null}
                onSaved={onSaved}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function GroupProgress({ matches }) {
  const done = matches.filter((m) => m.home_score !== null).length
  const total = matches.length
  return (
    <span className="text-xs text-white/25 font-medium whitespace-nowrap">
      {done}/{total} jugados
    </span>
  )
}

// ── Generic phase view ────────────────────────────────────────────────────────

function PhaseView({ matches, predictions, onSaved }) {
  if (matches.length === 0) return <EmptyPhase />

  // Sub-group by round_name for phases that may have multiple (e.g. Tercer Puesto + Final)
  const rounds = [...new Set(matches.map((m) => m.round_name))].sort()

  return (
    <div className="space-y-8">
      {rounds.map((round) => {
        const roundMatches = matches.filter((m) => m.round_name === round)
        return (
          <section key={round}>
            {rounds.length > 1 && (
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-3 px-1">
                {round}
              </h2>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roundMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  prediction={predictions[m.id] ?? null}
                  onSaved={onSaved}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function EmptyPhase() {
  return (
    <div className="text-center py-20 text-white/25">
      <p className="text-4xl mb-3">📭</p>
      <p className="font-medium">No hay partidos en esta fase aún</p>
    </div>
  )
}
