import { useEffect, useState } from 'react'
import { getMatches } from '../api/matches'
import { getMyPredictions } from '../api/predictions'
import HowToPlayModal from '../components/HowToPlayModal'
import MatchCard from '../components/MatchCard'
import ViewLayoutToggle from '../components/ViewLayoutToggle'
import { useAuth } from '../context/AuthContext'
import { sortMatches } from '../utils/matchSort'

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
  const [howToOpen, setHowToOpen] = useState(false)
  const [groupsLayout, setGroupsLayout] = useState('chronological')

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
      className="min-h-screen stadium-bg"
      style={{
        backgroundImage: 'url(/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      {/* Overlay oscuro sobre el estadio */}
      <div style={{ background: 'rgba(0,0,0,0.6)', minHeight: '100vh' }}>
    <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
      {/* Stats bar — compacto en una sola fila */}
      <div
        className="rounded-2xl px-3 py-3 sm:px-5 sm:py-3.5 mb-4 flex items-stretch gap-3 sm:gap-0"
        style={{ background: '#111111', border: '1px solid #1e1e1e' }}
      >
        <div
          className="flex flex-col justify-center shrink-0 pr-3 sm:pr-5 sm:mr-5 sm:border-r"
          style={{ borderColor: '#2a2a2a' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-dark-muted mb-0.5">Tus puntos</p>
          <span className="text-3xl sm:text-4xl font-black text-white leading-none tabular-nums">
            {user.total_points}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-between sm:justify-start sm:gap-8 min-w-0">
          <PointsStat label="Exactos" value={user.exact_results} hint="×5" color="text-green-400" />
          <PointsStat label="Parciales" value={user.partial_score_hits} hint="×3" color="text-yellow-400" />
          <PointsStat label="Predicciones" value={Object.keys(predictions).length} color="text-on-dark" />
        </div>
      </div>

      <div className="flex justify-center mb-4 px-1">
        <button
          type="button"
          onClick={() => setHowToOpen(true)}
          className="w-full max-w-md flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #00c9a7, #0057ff)',
            boxShadow: '0 4px 24px rgba(0, 180, 150, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Cómo jugar
        </button>
      </div>

      {howToOpen && <HowToPlayModal onClose={() => setHowToOpen(false)} />}

      {matches.length === 0 ? (
        <div className="text-center py-20 text-on-dark-muted">
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
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-base font-semibold whitespace-nowrap transition-all"
                    style={isActive
                      ? { background: 'linear-gradient(135deg,#00c9a7,#0057ff)', color: '#fff', boxShadow: '0 2px 12px rgba(0,180,150,0.25)' }
                      : { background: '#111111', color: 'rgba(255,255,255,0.72)', border: '1px solid #333' }
                    }
                  >
                    <span>{phase.label}</span>
                    <span className="text-sm rounded-full px-2 py-0.5 font-bold"
                      style={isActive ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: '#1e1e1e', color: 'rgba(255,255,255,0.65)' }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {activePhase === 'grupos' && (
            <ViewLayoutToggle
              value={groupsLayout}
              onChange={setGroupsLayout}
              className="justify-center mb-6"
            />
          )}

          {activePhase === 'grupos' ? (
            <GroupsView
              matches={phaseMatches}
              predictions={predictions}
              onSaved={load}
              layout={groupsLayout}
            />
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

function GroupsView({ matches, predictions, onSaved, layout }) {
  if (matches.length === 0) return <EmptyPhase />

  if (layout === 'chronological') {
    const sorted = sortMatches(matches)
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-dark-muted px-1 text-center">
          Del más próximo al más lejano
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predictions[m.id] ?? null}
              onSaved={onSaved}
            />
          ))}
        </div>
      </div>
    )
  }

  const byGroup = GROUP_ORDER.reduce((acc, letter) => {
    const g = sortMatches(matches.filter((m) => m.round_name === `Grupo ${letter}`))
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
            <h2 className="text-lg font-bold text-on-dark">Grupo {letter}</h2>
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
    <span className="text-base font-bold text-on-dark-muted whitespace-nowrap">
      {done}/{total} jugados
    </span>
  )
}

// ── Generic phase view ────────────────────────────────────────────────────────

function PhaseView({ matches, predictions, onSaved }) {
  if (matches.length === 0) return <EmptyPhase />

  const rounds = [...new Set(matches.map((m) => m.round_name))].sort()

  return (
    <div className="space-y-8">
      {rounds.map((round) => {
        const roundMatches = sortMatches(matches.filter((m) => m.round_name === round))
        return (
          <section key={round}>
            {rounds.length > 1 && (
              <h2 className="text-xs font-semibold uppercase tracking-widest text-on-dark-muted mb-3 px-1">
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
    <div className="text-center py-20 text-on-dark-muted">
      <p className="text-4xl mb-3">📭</p>
      <p className="font-medium">No hay partidos en esta fase aún</p>
    </div>
  )
}

function PointsStat({ label, value, hint, color = 'text-white' }) {
  return (
    <div className="text-center sm:text-left min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-dark-muted truncate">{label}</p>
      <div className="flex items-baseline justify-center sm:justify-start gap-1">
        <span className={`text-xl sm:text-2xl font-black tabular-nums leading-tight ${color}`}>{value}</span>
        {hint && <span className="text-[10px] font-semibold text-on-dark-subtle">{hint}</span>}
      </div>
    </div>
  )
}
