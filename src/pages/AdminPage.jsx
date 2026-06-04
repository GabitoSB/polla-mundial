import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TeamSelect from '../components/TeamSelect'
import { MUNDIAL_COUNTRIES } from '../constants/countries'
import { createMatch, deleteMatch, getMatches, updateResult, updateSchedule, updateTeams } from '../api/matches'

const isoOf = (name) => MUNDIAL_COUNTRIES.find((c) => c.name === name)?.iso ?? null

function FlagImg({ name, size = 20 }) {
  const iso = isoOf(name)
  if (!iso) return null
  return (
    <img
      src={`https://flagcdn.com/w${size}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${size * 2}/${iso}.png 2x`}
      width={size}
      alt={name}
      className="rounded-sm inline-block flex-shrink-0"
      style={{ height: size * 0.67 }}
    />
  )
}

// ── Phase ordering ─────────────────────────────────────────────────────────────

const PHASE_ORDER = [
  'Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F',
  'Grupo G', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K', 'Grupo L',
  'Dieciseisavos', 'Octavos de Final', 'Cuartos de Final',
  'Semifinal', 'Tercer Puesto', 'Final',
]

const phaseIndex = (r) => {
  const i = PHASE_ORDER.indexOf(r)
  return i === -1 ? 999 : i
}

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
  open:     { label: 'Abierto',    cls: 'bg-green-500/15 text-green-400 border border-green-500/20' },
  locked:   { label: 'En curso',   cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
  finished: { label: 'Finalizado', cls: 'bg-white/5 text-white/30 border border-white/8' },
}

/** Returns true if the team name is a TBD placeholder (bracket reference) */
const isTBD = (name) =>
  !name || /^(ganador|perdedor|1[°º]|2[°º]|3[°º])/i.test(name.trim())

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all"
      style={active
        ? { background: 'linear-gradient(135deg,#00c9a7,#0057ff)', color: '#fff', boxShadow: '0 2px 12px rgba(0,180,150,0.2)' }
        : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }
      }
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

// ── Inline team editor ────────────────────────────────────────────────────────

function TeamEditRow({ match, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [homeTeam, setHomeTeam] = useState(match.home_team)
  const [awayTeam, setAwayTeam] = useState(match.away_team)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSave = async () => {
    if (!homeTeam || !awayTeam) return
    setSaving(true)
    try {
      await updateTeams(match.id, { home_team: homeTeam, away_team: awayTeam })
      setMsg('ok')
      setTimeout(() => { setMsg(null); setEditing(false) }, 2000)
      onSaved()
    } catch {
      setMsg('error')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setHomeTeam(match.home_team); setAwayTeam(match.away_team); setEditing(true) }}
        className="text-xs text-teal-500 hover:text-teal-300 font-semibold ml-1"
        title="Editar equipos"
      >
        ✏️
      </button>
    )
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl p-3"
      style={{ background: 'rgba(0,180,150,0.07)', border: '1px solid rgba(0,180,150,0.15)' }}>
      <div className="flex-1 min-w-[140px]">
        <TeamSelect value={homeTeam} onChange={setHomeTeam} placeholder="Local" exclude={awayTeam} />
      </div>
      <span className="text-white/30 font-bold text-sm">VS</span>
      <div className="flex-1 min-w-[140px]">
        <TeamSelect value={awayTeam} onChange={setAwayTeam} placeholder="Visitante" exclude={homeTeam} />
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !homeTeam || !awayTeam}
        className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
        style={{ background: 'linear-gradient(135deg,#00c9a7,#0057ff)' }}
      >
        {saving ? '…' : 'Guardar'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-white/30 hover:text-white/60 px-2 py-1.5 rounded-lg transition-colors"
      >
        Cancelar
      </button>
      {msg === 'ok' && <span className="text-green-400 text-xs font-semibold">✓ Actualizado</span>}
      {msg === 'error' && <span className="text-red-400 text-xs">Error</span>}
    </div>
  )
}

// ── Inline date/time editor ───────────────────────────────────────────────────

function DateEditRow({ match, onSaved }) {
  const [editing, setEditing] = useState(false)
  const toLocalInput = (iso) => {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const [value, setValue] = useState(toLocalInput(match.start_time))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSave = async () => {
    if (!value) return
    setSaving(true)
    try {
      await updateSchedule(match.id, { start_time: new Date(value).toISOString() })
      setMsg('ok')
      setTimeout(() => { setMsg(null); setEditing(false) }, 2000)
      onSaved()
    } catch {
      setMsg('error')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(toLocalInput(match.start_time)); setEditing(true) }}
        className="text-xs text-white/30 hover:text-white/60 transition-colors ml-1"
        title="Editar fecha y hora"
      >
        🕐
      </button>
    )
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl p-3"
      style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.15)' }}>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', colorScheme: 'dark' }}
      />
      <button
        onClick={handleSave}
        disabled={saving || !value}
        className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
        style={{ background: 'rgba(200,150,0,0.4)', border: '1px solid rgba(255,180,0,0.2)' }}
      >
        {saving ? '…' : 'Guardar'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-white/30 hover:text-white/60 px-2 py-1.5 rounded-lg transition-colors"
      >
        Cancelar
      </button>
      {msg === 'ok' && <span className="text-yellow-400 text-xs font-semibold">✓ Actualizado</span>}
      {msg === 'error' && <span className="text-red-400 text-xs">Error</span>}
    </div>
  )
}

// ── Create match tab ──────────────────────────────────────────────────────────

function CreateMatchTab({ onCreated }) {
  const empty = { match_number: '', home_team: '', away_team: '', round_name: '', start_time: '' }
  const [form, setForm] = useState(empty)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.home_team || !form.away_team) {
      setError('Seleccioná ambos equipos')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await createMatch({
        ...form,
        match_number: form.match_number ? Number(form.match_number) : null,
        start_time: new Date(form.start_time).toISOString(),
      })
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

  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
  const inputStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a' }

  return (
    <div className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
      <h2 className="text-lg font-bold text-white mb-1">Nuevo enfrentamiento</h2>
      <p className="text-sm text-white/30 mb-6">
        Las predicciones se bloquean automáticamente en la fecha/hora indicada.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-widest">
              Equipo Local 🏠
            </label>
            <TeamSelect value={form.home_team} onChange={(v) => set('home_team', v)} placeholder="Seleccionar local" exclude={form.away_team} />
          </div>
          <div className="mt-5 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white/30 font-bold text-sm"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            VS
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-widest">
              Equipo Visitante ✈️
            </label>
            <TeamSelect value={form.away_team} onChange={(v) => set('away_team', v)} placeholder="Seleccionar visitante" exclude={form.home_team} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-widest">Fase / Grupo</label>
            <input value={form.round_name} onChange={(e) => set('round_name', e.target.value)} className={inputCls} style={inputStyle} placeholder="ej: Grupo A, Final…" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-widest">N° de partido</label>
            <input type="number" min="1" max="104" value={form.match_number} onChange={(e) => set('match_number', e.target.value)} className={inputCls} style={inputStyle} placeholder="ej: 1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-widest">Fecha y hora ⏰</label>
            <input required type="datetime-local" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
        </div>

        {form.home_team && form.away_team && form.start_time && (
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(0,180,150,0.07)', border: '1px solid rgba(0,180,150,0.15)' }}>
            <div className="text-sm">
              <span className="font-bold text-white/80">{form.home_team}</span>
              <span className="mx-3 text-teal-500 font-bold">VS</span>
              <span className="font-bold text-white/80">{form.away_team}</span>
              {form.round_name && <span className="ml-2 text-xs text-teal-400">· {form.round_name}</span>}
            </div>
            <span className="text-xs text-white/30">{fmt(form.start_time)}</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(127,0,0,0.2)', border: '1px solid rgba(200,50,50,0.2)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-400 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'rgba(0,150,80,0.15)', border: '1px solid rgba(0,200,100,0.2)' }}>
            ✓ Partido creado correctamente
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={creating}
            className="text-white font-semibold px-8 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#00c9a7,#0057ff)', boxShadow: '0 2px 12px rgba(0,180,150,0.2)' }}>
            {creating ? <><span className="animate-spin">⏳</span> Creando…</> : <>+ Agregar partido</>}
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
    } catch {
      setSaveMsg((s) => ({ ...s, [m.id]: 'error' }))
    } finally {
      setSaving((s) => ({ ...s, [m.id]: false }))
    }
  }

  const filtered = filter === 'all' ? matches
    : matches.filter((m) => matchStatus(m) === filter)

  // Group by round_name, sorted by phase order
  const groups = filtered.reduce((acc, m) => {
    const key = m.round_name ?? 'Sin fase'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const sortedGroupKeys = Object.keys(groups).sort((a, b) => phaseIndex(a) - phaseIndex(b))

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-2xl px-4 py-3 flex flex-wrap gap-2 items-center" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
        <span className="text-xs font-semibold text-white/25 uppercase tracking-widest mr-2">Filtrar:</span>
        {['all', 'open', 'locked', 'finished'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
            style={filter === f
              ? { background: 'linear-gradient(135deg,#00c9a7,#0057ff)', color: '#fff' }
              : { background: '#1e1e1e', color: 'rgba(255,255,255,0.35)' }
            }>
            {{ all: 'Todos', open: 'Abiertos', locked: 'En curso', finished: 'Finalizados' }[f]}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/20">{filtered.length} partido{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl py-16 text-center text-white/25" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No hay partidos en esta categoría</p>
        </div>
      )}

      {sortedGroupKeys.map((round) => {
        const roundMatches = groups[round]
        return (
          <div key={round} className="rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
              <span className="text-sm font-bold text-white/60">{round}</span>
              <span className="text-xs text-white/20">({roundMatches.length} partido{roundMatches.length !== 1 ? 's' : ''})</span>
            </div>

            <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
              {roundMatches.map((m) => {
                const status = matchStatus(m)
                const { label, cls } = STATUS_LABEL[status]
                const r = results[m.id] ?? {}
                const curHome = r.home !== undefined ? r.home : (m.home_score ?? '')
                const curAway = r.away !== undefined ? r.away : (m.away_score ?? '')
                const msg = saveMsg[m.id]
                const isKnockout = m.match_number != null && m.match_number >= 73
                const inputCls = "w-14 text-center rounded-lg px-2 py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                const inputStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a' }

                return (
                  <div key={m.id} className="px-5 py-4" style={{ borderBottomColor: '#1a1a1a' }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {m.match_number && (
                            <span className="bg-white/8 text-white/40 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              P{m.match_number}
                            </span>
                          )}
                          {!isTBD(m.home_team) && <FlagImg name={m.home_team} size={20} />}
                          <span className={`font-bold ${isTBD(m.home_team) ? 'text-white/25 italic' : 'text-white/70'}`}>{m.home_team}</span>
                          <span className="text-xs font-bold text-white/20">VS</span>
                          {!isTBD(m.away_team) && <FlagImg name={m.away_team} size={20} />}
                          <span className={`font-bold ${isTBD(m.away_team) ? 'text-white/25 italic' : 'text-white/70'}`}>{m.away_team}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                          {isKnockout && status !== 'finished' && <TeamEditRow match={m} onSaved={onRefresh} />}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-xs text-white/20">{fmt(m.start_time)}</p>
                          <DateEditRow match={m} onSaved={onRefresh} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input type="number" min="0" value={curHome} onChange={(e) => setResult(m.id, 'home', e.target.value)} className={inputCls} style={inputStyle} placeholder="–" />
                        <span className="text-white/20 font-bold text-lg">–</span>
                        <input type="number" min="0" value={curAway} onChange={(e) => setResult(m.id, 'away', e.target.value)} className={inputCls} style={inputStyle} placeholder="–" />
                        <button onClick={() => handleSaveResult(m)} disabled={saving[m.id]}
                          className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap disabled:opacity-30"
                          style={{ background: 'rgba(0,180,100,0.3)', border: '1px solid rgba(0,200,100,0.2)' }}>
                          {saving[m.id] ? '…' : status === 'finished' ? 'Corregir' : 'Guardar'}
                        </button>
                        {msg === 'ok' && <span className="text-green-400 text-xs font-semibold">✓</span>}
                        {msg === 'error' && <span className="text-red-400 text-xs">Error</span>}
                      </div>

                      {status !== 'finished' && (
                        <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                          className="text-red-500/50 hover:text-red-400 p-1.5 rounded-lg transition-colors text-xs disabled:opacity-40"
                          title="Eliminar partido">
                          {deleting === m.id ? '…' : '🗑️'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Bracket tab ───────────────────────────────────────────────────────────────

function BracketTab({ matches, onRefresh }) {
  const knockout = matches
    .filter((m) => m.match_number != null && m.match_number >= 73)
    .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0))

  const sections = [
    { label: 'Dieciseisavos de Final', from: 73, to: 88 },
    { label: 'Octavos de Final', from: 89, to: 96 },
    { label: 'Cuartos de Final', from: 97, to: 100 },
    { label: 'Semifinales', from: 101, to: 102 },
    { label: 'Tercer Puesto y Final', from: 103, to: 104 },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 text-sm text-amber-400"
        style={{ background: 'rgba(180,120,0,0.1)', border: '1px solid rgba(180,120,0,0.2)' }}>
        <p className="font-semibold mb-1">Actualización automática del bracket</p>
        <p className="text-amber-400/70">
          Al guardar el resultado de un partido eliminatorio, el sistema asigna
          automáticamente al ganador en el siguiente partido del bracket.
          Para Dieciseisavos, al completar todos los partidos de un grupo los clasificados se asignan solos.
          Podés también editar manualmente con el botón ✏️.
        </p>
      </div>

      {sections.map(({ label, from, to }) => {
        const sectionMatches = knockout.filter((m) => m.match_number >= from && m.match_number <= to)
        if (sectionMatches.length === 0) return null

        return (
          <div key={label} className="rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
            <div className="px-5 py-3" style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
              <span className="text-sm font-bold text-teal-400">{label}</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
              {sectionMatches.map((m) => {
                const status = matchStatus(m)
                const { label: statusLabel, cls } = STATUS_LABEL[status]
                const homeTBD = isTBD(m.home_team)
                const awayTBD = isTBD(m.away_team)

                return (
                  <div key={m.id} className="px-5 py-4">
                    <div className="flex items-start gap-3 flex-wrap">
                      <span className="bg-white/8 text-white/40 text-xs font-bold px-2 py-1 rounded-full mt-0.5 flex-shrink-0">
                        P{m.match_number}
                      </span>
                      <div className="flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!homeTBD && <FlagImg name={m.home_team} size={20} />}
                          <span className={homeTBD ? 'text-white/25 text-xs italic' : 'text-sm font-bold text-white/70'}>{m.home_team}</span>
                          <span className="text-xs text-white/20 font-bold">vs</span>
                          {!awayTBD && <FlagImg name={m.away_team} size={20} />}
                          <span className={awayTBD ? 'text-white/25 text-xs italic' : 'text-sm font-bold text-white/70'}>{m.away_team}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{statusLabel}</span>
                          {m.home_score !== null && (
                            <span className="text-xs font-black text-white/60 px-2 py-0.5 rounded-lg" style={{ background: '#1e1e1e' }}>
                              {m.home_score} – {m.away_score}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/20 mt-0.5">{fmt(m.start_time)}</p>
                        {status !== 'finished' && <TeamEditRow match={m} onSaved={onRefresh} />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
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

  // Count TBD knockout matches for bracket badge
  const tbdKnockout = matches.filter(
    (m) => m.match_number >= 73 && (isTBD(m.home_team) || isTBD(m.away_team)),
  ).length

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Panel de Administración</h1>
          <p className="text-white/30 text-sm mt-0.5">Gestioná los partidos y resultados del torneo</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 px-4 py-2 rounded-xl transition-colors font-medium"
          style={{ background: '#111111', border: '1px solid #2a2a2a' }}>
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
      <div className="flex gap-1 p-1 rounded-2xl w-fit flex-wrap" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
        <TabBtn active={tab === 'create'} onClick={() => setTab('create')}>
          ➕ Crear partido
        </TabBtn>
        <TabBtn active={tab === 'manage'} onClick={() => setTab('manage')}>
          📋 Gestionar {total > 0 && `(${total})`}
        </TabBtn>
        <TabBtn active={tab === 'bracket'} onClick={() => setTab('bracket')}>
          🔗 Bracket eliminatorias
          {tbdKnockout > 0 && (
            <span className="ml-1.5 bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-black px-1.5 py-0.5 rounded-full">
              {tbdKnockout}
            </span>
          )}
        </TabBtn>
      </div>

      {/* Tab content */}
      {tab === 'create' && (
        <CreateMatchTab onCreated={() => { load(); setTab('manage') }} />
      )}
      {tab === 'manage' && (
        <MatchListTab matches={matches} onRefresh={load} />
      )}
      {tab === 'bracket' && (
        <BracketTab matches={matches} onRefresh={load} />
      )}
    </div>
  )
}
