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
    test: (r) => r && r.startsWith('Grupo '),
  },
  {
    key: 'dieciseisavos',
    label: 'Dieciseisavos',
    test: (r) => r === 'Dieciseisavos',
  },
  {
    key: 'octavos',
    label: 'Octavos',
    test: (r) => r === 'Octavos de Final',
  },
  {
    key: 'cuartos',
    label: 'Cuartos',
    test: (r) => r === 'Cuartos de Final',
  },
  {
    key: 'semis',
    label: 'Semis',
    test: (r) => r === 'Semifinal',
  },
  {
    key: 'tercer',
    label: '3er Puesto',
    test: (r) => r === 'Tercer Puesto',
  },
  {
    key: 'final',
    label: 'Final',
    test: (r) => r === 'Final',
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
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'url(/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay oscuro sobre el estadio */}
      <div style={{ background: 'rgba(0,0,0,0.6)', minHeight: '100vh' }}>
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Stats bar */}
      <div className="rounded-2xl p-6 mb-6 flex flex-col items-center gap-4"
        style={{ background: '#111111', border: '1px solid #1e1e1e' }}>

        {/* Tus puntos — recuadro principal */}
        <div className="flex flex-col items-center text-center px-10 py-4 rounded-2xl"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Tus puntos</p>
          <span className="text-7xl font-black text-white leading-none">{user.total_points}</span>
        </div>

        {/* Detalles — recuadros secundarios debajo */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center text-center px-5 py-3 rounded-2xl"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Exactos</p>
            <span className="text-2xl font-black text-green-400">{user.exact_results}</span>
            <span className="text-green-700 text-[10px] font-semibold mt-0.5">×5 pts</span>
          </div>
          <div className="flex flex-col items-center text-center px-5 py-3 rounded-2xl"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Parciales</p>
            <span className="text-2xl font-black text-yellow-400">{user.partial_score_hits}</span>
            <span className="text-yellow-700 text-[10px] font-semibold mt-0.5">×3 pts</span>
          </div>
          <div className="flex flex-col items-center text-center px-5 py-3 rounded-2xl"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Predicciones</p>
            <span className="text-2xl font-black text-white/40">{Object.keys(predictions).length}</span>
            <span className="text-[10px] invisible mt-0.5">·</span>
          </div>
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
      </div>
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
    <span className="text-sm font-bold text-white/70 whitespace-nowrap">
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
