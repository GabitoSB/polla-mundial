import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { createMatch, deleteMatch, getMatches, updateResult } from '../api/matches'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (dt) =>
  new Date(dt).toLocaleString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })

function matchStatus(m) {
  const now = new Date()
  const start = new Date(m.start_time)
  if (m.home_score !== null) return 'finished'
  if (now >= start) return 'locked'
  return 'open'
}

const STATUS_LABEL = {
  open:     { label: 'Abierto',    cls: 'bg-green-100 text-green-700' },
  locked:   { label: 'En curso',   cls: 'bg-orange-100 text-orange-700' },
  finished: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-600' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors
        ${active ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  )
}

function StatCard({ value, label, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-500 to-blue-700',
    green:  'from-green-500 to-green-700',
    orange: 'from-orange-400 to-orange-600',
    gray:   'from-gray-400 to-gray-600',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-white`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-medium opacity-80 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  )
}

// ── Create match tab ──────────────────────────────────────────────────────────

function CreateMatchTab({ onCreated }) {
  const empty = { home_team: '', away_team: '', round_name: '', start_time: '' }
  const [form, setForm] = useState(empty)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await createMatch({ ...form, start_time: new Date(form.start_time).toISOString() })
      setForm(empty)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onCreated()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Error al crear partido')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Nuevo enfrentamiento</h2>
      <p className="text-sm text-gray-400 mb-6">
        Las predicciones se bloquean automáticamente en la fecha/hora indicada.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Teams row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Equipo Local 🏠
            </label>
            <input
              required
              value={form.home_team}
              onChange={(e) => set('home_team', e.target.value)}
              className="input"
              placeholder="Argentina"
            />
          </div>

          <div className="mt-5 flex-shrink-0 w-10 h-10 flex items-center justify-center
                          bg-gray-100 rounded-xl text-gray-400 font-bold text-sm">
            VS
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Equipo Visitante ✈️
            </label>
            <input
              required
              value={form.away_team}
              onChange={(e) => set('away_team', e.target.value)}
              className="input"
              placeholder="Brasil"
            />
          </div>
        </div>

        {/* Round + datetime row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Fase / Grupo
            </label>
            <input
              value={form.round_name}
              onChange={(e) => set('round_name', e.target.value)}
              className="input"
              placeholder="ej: Grupo A, Octavos, Final…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Fecha y hora de inicio ⏰
            </label>
            <input
              required
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => set('start_time', e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Preview */}
        {form.home_team && form.away_team && form.start_time && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-bold text-gray-800">{form.home_team}</span>
              <span className="mx-3 text-blue-400 font-bold">VS</span>
              <span className="font-bold text-gray-800">{form.away_team}</span>
              {form.round_name && (
                <span className="ml-2 text-xs text-blue-500 font-medium">· {form.round_name}</span>
              )}
            </div>
            <span className="text-xs text-blue-600 font-medium">
              {fmt(form.start_time)}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl font-medium">
            ✓ Partido creado correctamente
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white
                       font-semibold px-8 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            {creating ? (
              <><span className="animate-spin">⏳</span> Creando…</>
            ) : (
              <>+ Agregar partido</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Match list tab ────────────────────────────────────────────────────────────

function MatchListTab({ matches, onRefresh }) {
  const [deleting, setDeleting] = useState(null)
  const [results, setResults] = useState({})
  const [saving, setSaving] = useState({})
  const [saveMsg, setSaveMsg] = useState({})
  const [filter, setFilter] = useState('all')

  const setResult = (id, field, val) =>
    setResults((r) => ({ ...r, [id]: { ...(r[id] ?? {}), [field]: val } }))

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este partido? También se eliminarán las predicciones asociadas.')) return
    setDeleting(id)
    try {
      await deleteMatch(id)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.detail ?? 'Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  const handleSaveResult = async (m) => {
    const r = results[m.id]
    const home = r?.home !== undefined ? r.home : m.home_score
    const away = r?.away !== undefined ? r.away : m.away_score
    if (home === '' || home === null || home === undefined) return
    if (away === '' || away === null || away === undefined) return

    setSaving((s) => ({ ...s, [m.id]: true }))
    try {
      await updateResult(m.id, { home_score: Number(home), away_score: Number(away) })
      setSaveMsg((s) => ({ ...s, [m.id]: 'ok' }))
      setTimeout(() => setSaveMsg((s) => ({ ...s, [m.id]: null })), 3000)
      onRefresh()
    } catch (err) {
      setSaveMsg((s) => ({ ...s, [m.id]: 'error' }))
    } finally {
      setSaving((s) => ({ ...s, [m.id]: false }))
    }
  }

  const filtered = filter === 'all' ? matches
    : matches.filter((m) => matchStatus(m) === filter)

  const groups = filtered.reduce((acc, m) => {
    const key = m.round_name ?? 'Sin fase'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-md px-4 py-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-2">Filtrar:</span>
        {['all', 'open', 'locked', 'finished'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {{ all: 'Todos', open: 'Abiertos', locked: 'En curso', finished: 'Finalizados' }[f]}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} partido{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-md py-16 text-center text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No hay partidos en esta categoría</p>
        </div>
      )}

      {Object.entries(groups).map(([round, roundMatches]) => (
        <div key={round} className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Round header */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">{round}</span>
            <span className="text-xs text-gray-400">({roundMatches.length} partido{roundMatches.length !== 1 ? 's' : ''})</span>
          </div>

          <div className="divide-y divide-gray-100">
            {roundMatches.map((m) => {
              const status = matchStatus(m)
              const { label, cls } = STATUS_LABEL[status]
              const r = results[m.id] ?? {}
              const curHome = r.home !== undefined ? r.home : (m.home_score ?? '')
              const curAway = r.away !== undefined ? r.away : (m.away_score ?? '')
              const msg = saveMsg[m.id]

              return (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Match info */}
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">{m.home_team}</span>
                        <span className="text-xs font-bold text-gray-400">VS</span>
                        <span className="font-bold text-gray-800">{m.away_team}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(m.start_time)}</p>
                    </div>

                    {/* Result inputs */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0"
                        value={curHome}
                        onChange={(e) => setResult(m.id, 'home', e.target.value)}
                        className="w-14 text-center border border-gray-300 rounded-lg px-2 py-1.5
                                   text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="–"
                      />
                      <span className="text-gray-400 font-bold text-lg">–</span>
                      <input
                        type="number" min="0"
                        value={curAway}
                        onChange={(e) => setResult(m.id, 'away', e.target.value)}
                        className="w-14 text-center border border-gray-300 rounded-lg px-2 py-1.5
                                   text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="–"
                      />
                      <button
                        onClick={() => handleSaveResult(m)}
                        disabled={saving[m.id]}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white
                                   text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {saving[m.id] ? '…' : status === 'finished' ? 'Corregir' : 'Guardar'}
                      </button>

                      {msg === 'ok' && <span className="text-green-600 text-xs font-semibold">✓ Guardado</span>}
                      {msg === 'error' && <span className="text-red-500 text-xs">Error</span>}
                    </div>

                    {/* Delete */}
                    {status !== 'finished' && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg
                                   transition-colors text-xs font-semibold disabled:opacity-40"
                        title="Eliminar partido"
                      >
                        {deleting === m.id ? '…' : '🗑️'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main AdminPage ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState('create')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  const load = async () => {
    setLoading(true)
    const { data } = await getMatches()
    setMatches(data)
    setLoading(false)
  }

  // Reload every time the user navigates to this page
  useEffect(() => { load() }, [location.key])

  const total    = matches.length
  const open     = matches.filter((m) => matchStatus(m) === 'open').length
  const locked   = matches.filter((m) => matchStatus(m) === 'locked').length
  const finished = matches.filter((m) => matchStatus(m) === 'finished').length

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestioná los partidos y resultados del torneo</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600
                     bg-white hover:bg-blue-50 border border-gray-200 px-4 py-2 rounded-xl
                     transition-colors font-medium shadow-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={total}    label="Total partidos" color="blue" />
        <StatCard value={open}     label="Abiertos"       color="green" />
        <StatCard value={locked}   label="En curso"       color="orange" />
        <StatCard value={finished} label="Finalizados"    color="gray" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <TabBtn active={tab === 'create'} onClick={() => setTab('create')}>
          ➕ Crear partido
        </TabBtn>
        <TabBtn active={tab === 'manage'} onClick={() => setTab('manage')}>
          📋 Gestionar partidos {total > 0 && `(${total})`}
        </TabBtn>
      </div>

      {/* Tab content */}
      {tab === 'create' ? (
        <CreateMatchTab onCreated={() => { load(); setTab('manage') }} />
      ) : (
        <MatchListTab matches={matches} onRefresh={load} />
      )}
    </div>
  )
}
