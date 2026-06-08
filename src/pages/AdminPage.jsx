import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MUNDIAL_COUNTRIES } from '../constants/countries'
import { deleteMatch, getMatchPredictions, getMatches, updateResult, updateSchedule } from '../api/matches'
import BracketDiagram from '../components/BracketDiagram'
import ViewLayoutToggle from '../components/ViewLayoutToggle'
import { sortMatches } from '../utils/matchSort'

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
  new Date(dt).toLocaleString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })

function matchStatus(m) {
  return m.home_score != null ? 'finished' : 'open'
}

const STATUS_LABEL = {
  open:     { label: 'Sin resultado', cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/25' },
  finished: { label: 'Con resultado', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' },
}

const ROW_STYLE = {
  open:     { border: 'border-l-amber-500/70',   bg: 'rgba(251,191,36,0.04)' },
  finished: { border: 'border-l-emerald-500/80', bg: 'rgba(16,185,129,0.06)' },
}

/** Returns true if the team name is a TBD placeholder (bracket reference) */
const isTBD = (name) =>
  !name || /^(ganador|perdedor|1[°º]|2[°º]|3[°º])/i.test(name.trim())

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all text-center"
      style={active
        ? { background: 'linear-gradient(135deg,#00c9a7,#0057ff)', color: '#fff', boxShadow: '0 2px 12px rgba(0,180,150,0.2)' }
        : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }
      }
    >
      {children}
    </button>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 w-full sm:min-w-[10rem] sm:w-auto">
      <label className="text-[10px] font-semibold text-on-dark-muted uppercase tracking-widest">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-medium text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', colorScheme: 'dark' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function StatCard({ value, label, color = 'blue' }) {
  const styles = {
    blue:  { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  text: 'text-blue-400' },
    amber: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  text: 'text-amber-400' },
    green: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  text: 'text-emerald-400' },
    orange: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', text: 'text-orange-400' },
    gray:  { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'text-white/50' },
  }
  const style = styles[color] ?? styles.blue

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
    >
      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">{label}</span>
      <span className={`text-lg font-black leading-none ${style.text}`}>{value}</span>
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

// ── Match list tab ────────────────────────────────────────────────────────────

const KNOCKOUT_ROUND_NAMES = new Set([
  'Dieciseisavos', 'Octavos de Final', 'Cuartos de Final',
  'Semifinal', 'Tercer Puesto', 'Final',
])

function fmtExtraTime(v) {
  if (v === true) return 'Sí'
  if (v === false) return 'No'
  return '—'
}

function formatPredictionsError(err) {
  const status = err.response?.status
  const detail = err.response?.data?.detail
  const msg = typeof detail === 'string' ? detail : null
  if (status === 404 && msg === 'Not Found') {
    return 'No se pudo cargar: el servidor no tiene esta función actualizada.'
  }
  if (msg) return msg
  return 'No se pudieron cargar las predicciones. Intenta de nuevo.'
}

/** Panel de solo lectura: predicciones de todos los usuarios para un partido */
function MatchPredictionsPanel({ match, isKnockout }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const hasResult = match.home_score != null && match.away_score != null

  const toggle = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    setError(null)
    try {
      const { data } = await getMatchPredictions(match.id)
      const sorted = [...data].sort((a, b) => {
        if (hasResult) return (b.points ?? -1) - (a.points ?? -1)
        return a.username.localeCompare(b.username)
      })
      setList(sorted)
    } catch (err) {
      setError(formatPredictionsError(err))
      setList([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 w-full">
      <button
        type="button"
        onClick={toggle}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: open ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(59,130,246,0.35)' : '1px solid #2a2a2a',
          color: open ? '#93c5fd' : 'rgba(255,255,255,0.45)',
        }}
      >
        {open ? '▾ Ocultar predicciones' : '▸ Ver predicciones de usuarios'}
      </button>

      {open && (
        <div
          className="mt-2 rounded-xl overflow-hidden"
          style={{ background: '#0d0d0d', border: '1px solid #252525' }}
        >
          {loading && (
            <p className="text-xs text-white/30 text-center py-4">Cargando…</p>
          )}
          {error && (
            <p className="text-xs text-red-400 text-center py-4">{error}</p>
          )}
          {!loading && !error && list.length === 0 && (
            <p className="text-xs text-white/40 text-center py-4">No hay predicciones aún</p>
          )}
          {!loading && !error && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/30 uppercase tracking-wider" style={{ background: '#161616' }}>
                    <th className="text-left px-3 py-2 font-semibold">Jugador</th>
                    <th className="text-center px-3 py-2 font-semibold">Marcador</th>
                    {isKnockout && (
                      <>
                        <th className="text-center px-3 py-2 font-semibold">Penales</th>
                        <th className="text-center px-3 py-2 font-semibold">Alargue</th>
                      </>
                    )}
                    {hasResult && <th className="text-center px-3 py-2 font-semibold">Pts</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        borderTop: '1px solid #1a1a1a',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <td className="px-3 py-2 font-medium text-white/70">{p.username}</td>
                      <td className="px-3 py-2 text-center font-bold text-white/80">
                        {p.predicted_home}–{p.predicted_away}
                      </td>
                      {isKnockout && (
                        <>
                          <td className="px-3 py-2 text-center text-white/50">
                            {p.predicted_penalty_winner ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-center text-white/50">
                            {fmtExtraTime(p.predicted_extra_time)}
                          </td>
                        </>
                      )}
                      {hasResult && (
                        <td className="px-3 py-2 text-center font-bold text-teal-400">
                          {p.points ?? 0}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] text-white/20 text-center py-2 border-t border-white/5">
            Solo lectura · supervisión
          </p>
        </div>
      )}
    </div>
  )
}

function useMatchResultEditor(onRefresh) {
  const [deleting, setDeleting] = useState(null)
  const [results, setResults] = useState({})
  const [penaltyWinners, setPenaltyWinners] = useState({})
  const [extraTimeMap, setExtraTimeMap] = useState({})
  const [saving, setSaving] = useState({})
  const [saveMsg, setSaveMsg] = useState({})

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

    const isKnockoutRound = KNOCKOUT_ROUND_NAMES.has(m.round_name)
    const isDraw = Number(home) === Number(away)
    const penaltyWinner = (isKnockoutRound && isDraw)
      ? (penaltyWinners[m.id] ?? m.penalty_winner ?? null)
      : null
    const hasExtraTime = isKnockoutRound
      ? (extraTimeMap[m.id] !== undefined ? extraTimeMap[m.id] : m.has_extra_time ?? null)
      : null

    setSaving((s) => ({ ...s, [m.id]: true }))
    try {
      await updateResult(m.id, {
        home_score: Number(home),
        away_score: Number(away),
        penalty_winner: penaltyWinner,
        has_extra_time: hasExtraTime,
      })
      setSaveMsg((s) => ({ ...s, [m.id]: 'ok' }))
      setTimeout(() => setSaveMsg((s) => ({ ...s, [m.id]: null })), 3000)
      onRefresh()
    } catch {
      setSaveMsg((s) => ({ ...s, [m.id]: 'error' }))
    } finally {
      setSaving((s) => ({ ...s, [m.id]: false }))
    }
  }

  return {
    deleting,
    results,
    penaltyWinners,
    extraTimeMap,
    saving,
    saveMsg,
    setResult,
    setPenaltyWinners,
    setExtraTimeMap,
    handleDelete,
    handleSaveResult,
  }
}

function AdminMatchRow({ match: m, editor, onRefresh, compact = false, showDelete = true }) {
  const {
    deleting, results, penaltyWinners, extraTimeMap, saving, saveMsg,
    setResult, setPenaltyWinners, setExtraTimeMap, handleDelete, handleSaveResult,
  } = editor

  const status = matchStatus(m)
  const { label, cls } = STATUS_LABEL[status]
  const r = results[m.id] ?? {}
  const curHome = r.home !== undefined ? r.home : (m.home_score ?? '')
  const curAway = r.away !== undefined ? r.away : (m.away_score ?? '')
  const msg = saveMsg[m.id]
  const isKnockoutRound = KNOCKOUT_ROUND_NAMES.has(m.round_name)
  const isDraw = curHome !== '' && curAway !== '' && Number(curHome) === Number(curAway)
  const showPenaltySelector = isKnockoutRound && isDraw && !isTBD(m.home_team) && !isTBD(m.away_team)
  const curPenaltyWinner = penaltyWinners[m.id] !== undefined ? penaltyWinners[m.id] : (m.penalty_winner ?? null)
  const curExtraTime = extraTimeMap[m.id] !== undefined ? extraTimeMap[m.id] : (m.has_extra_time ?? null)
  const isFinished = status === 'finished'
  const rowStyle = ROW_STYLE[status]
  const inputCls = 'w-12 text-center rounded-lg px-2 py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors'
  const inputStyle = isFinished
    ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }
    : { background: '#1a1a1a', border: '1px solid #2a2a2a' }

  const scoreControls = (
    <>
      <div className="flex flex-col items-start lg:items-end gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <input type="number" min="0" value={curHome}
            onChange={(e) => { setResult(m.id, 'home', e.target.value); setPenaltyWinners((p) => ({ ...p, [m.id]: null })) }}
            className={inputCls} style={inputStyle} placeholder="–" />
          <span className="text-white/20 font-bold">–</span>
          <input type="number" min="0" value={curAway}
            onChange={(e) => { setResult(m.id, 'away', e.target.value); setPenaltyWinners((p) => ({ ...p, [m.id]: null })) }}
            className={inputCls} style={inputStyle} placeholder="–" />
          <button type="button" onClick={() => handleSaveResult(m)} disabled={saving[m.id]}
            className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap disabled:opacity-30"
            style={isFinished
              ? { background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.35)' }
              : { background: 'rgba(0,180,100,0.3)', border: '1px solid rgba(0,200,100,0.2)' }
            }>
            {saving[m.id] ? '…' : isFinished ? 'Corregir' : 'Guardar'}
          </button>
          {msg === 'ok' && <span className="text-green-400 text-xs font-semibold">✓</span>}
          {msg === 'error' && <span className="text-red-400 text-xs">Error</span>}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
      </div>

      {isKnockoutRound && !isTBD(m.home_team) && !isTBD(m.away_team) && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg px-2 py-1.5 mt-2"
          style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <span className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wide">Alargue</span>
          {[true, false].map((opt) => (
            <button key={String(opt)} type="button"
              onClick={() => setExtraTimeMap((p) => ({ ...p, [m.id]: p[m.id] === opt ? null : opt }))}
              className="px-2 py-0.5 rounded text-[10px] font-bold transition-all"
              style={{
                background: curExtraTime === opt ? 'rgba(251,191,36,0.2)' : '#1a1a1a',
                border: curExtraTime === opt ? '1px solid rgba(251,191,36,0.5)' : '1px solid #2a2a2a',
                color: curExtraTime === opt ? '#fbbf24' : 'rgba(255,255,255,0.35)',
              }}>
              {opt ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      )}

      {showPenaltySelector && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg px-2 py-1.5 mt-2"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wide">Penales</span>
          {[m.home_team, m.away_team].map((team) => (
            <button key={team} type="button"
              onClick={() => setPenaltyWinners((p) => ({ ...p, [m.id]: p[m.id] === team ? null : team }))}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
              style={{
                background: curPenaltyWinner === team ? 'rgba(251,191,36,0.2)' : '#1a1a1a',
                border: curPenaltyWinner === team ? '1px solid rgba(251,191,36,0.5)' : '1px solid #2a2a2a',
                color: curPenaltyWinner === team ? '#fbbf24' : 'rgba(255,255,255,0.35)',
              }}>
              <FlagImg name={team} size={12} />
              <span className="max-w-[4.5rem] truncate">{team}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )

  if (compact) {
    return (
      <div
        className={`rounded-xl border-l-4 p-3 ${rowStyle.border}`}
        style={{ background: rowStyle.bg, borderColor: '#252525', borderLeftWidth: 4 }}
      >
        <div className="mb-2">
          <span className="text-[10px] font-bold text-on-dark-muted">P{m.match_number}</span>
        </div>
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {!isTBD(m.home_team) && <FlagImg name={m.home_team} size={14} />}
            <span className={`text-xs font-semibold truncate ${isTBD(m.home_team) ? 'text-on-dark-subtle italic' : 'text-on-dark'}`}>
              {m.home_team}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {!isTBD(m.away_team) && <FlagImg name={m.away_team} size={14} />}
            <span className={`text-xs font-semibold truncate ${isTBD(m.away_team) ? 'text-on-dark-subtle italic' : 'text-on-dark'}`}>
              {m.away_team}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-on-dark-muted mb-2">{fmt(m.start_time)}</p>
        {scoreControls}
        <MatchPredictionsPanel match={m} isKnockout={isKnockoutRound} />
      </div>
    )
  }

  return (
    <div
      className={`border-l-4 px-5 py-4 ${rowStyle.border}`}
      style={{ borderBottom: '1px solid #1a1a1a', background: rowStyle.bg }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_2rem] gap-3 items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {m.match_number && (
              <span className="bg-white/10 text-on-dark-muted text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                P{m.match_number}
              </span>
            )}
            {!isTBD(m.home_team) && <FlagImg name={m.home_team} size={20} />}
            <span className={`font-bold ${isTBD(m.home_team) ? 'text-on-dark-subtle italic' : 'text-on-dark'}`}>{m.home_team}</span>
            <span className="text-xs font-bold text-on-dark-subtle">VS</span>
            {!isTBD(m.away_team) && <FlagImg name={m.away_team} size={20} />}
            <span className={`font-bold ${isTBD(m.away_team) ? 'text-on-dark-subtle italic' : 'text-on-dark'}`}>{m.away_team}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-xs text-on-dark-muted">{fmt(m.start_time)}</p>
            <DateEditRow match={m} onSaved={onRefresh} />
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:justify-self-end">{scoreControls}</div>

        {showDelete && (
          <div className="flex justify-center lg:justify-end pt-1">
            {!isFinished ? (
              <button type="button" onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                className="text-red-500/50 hover:text-red-400 p-1.5 rounded-lg transition-colors text-xs disabled:opacity-40"
                title="Eliminar partido">
                {deleting === m.id ? '…' : '🗑️'}
              </button>
            ) : (
              <span className="w-7" aria-hidden />
            )}
          </div>
        )}
      </div>

      <MatchPredictionsPanel match={m} isKnockout={isKnockoutRound} />
    </div>
  )
}

function MatchListTab({ matches, onRefresh }) {
  const editor = useMatchResultEditor(onRefresh)
  const [resultFilter, setResultFilter] = useState('all')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [layout, setLayout] = useState('chronological')

  const phaseOptions = useMemo(() => {
    const names = [...new Set(matches.map((m) => m.round_name).filter(Boolean))]
    return names.sort((a, b) => phaseIndex(a) - phaseIndex(b))
  }, [matches])

  const filtered = matches.filter((m) => {
    if (resultFilter !== 'all' && matchStatus(m) !== resultFilter) return false
    if (phaseFilter !== 'all' && m.round_name !== phaseFilter) return false
    return true
  })

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
      <div
        className="rounded-2xl px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-end"
        style={{ background: '#111111', border: '1px solid #1e1e1e' }}
      >
        <FilterSelect
          label="Resultado"
          value={resultFilter}
          onChange={setResultFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'open', label: 'Sin resultado' },
            { value: 'finished', label: 'Con resultado' },
          ]}
        />
        <FilterSelect
          label="Grupo / fase"
          value={phaseFilter}
          onChange={setPhaseFilter}
          options={[
            { value: 'all', label: 'Todas las fases' },
            ...phaseOptions.map((name) => ({ value: name, label: name })),
          ]}
        />
        <ViewLayoutToggle value={layout} onChange={setLayout} className="sm:pb-0.5" />
        <span className="sm:ml-auto text-xs text-on-dark-muted sm:pb-2">
          {filtered.length} partido{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl py-16 text-center text-on-dark-muted" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No hay partidos en esta categoría</p>
        </div>
      )}

      {layout === 'chronological' ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
            <span className="text-sm font-bold text-on-dark">Por fecha</span>
            <span className="text-xs text-on-dark-subtle">del más próximo al más lejano</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
            {sortMatches(filtered).map((m) => (
              <AdminMatchRow key={m.id} match={m} editor={editor} onRefresh={onRefresh} />
            ))}
          </div>
        </div>
      ) : (
        sortedGroupKeys.map((round) => {
          const roundMatches = sortMatches(groups[round])
          return (
            <div key={round} className="rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
              <span className="text-sm font-bold text-on-dark">{round}</span>
              <span className="text-xs text-on-dark-subtle">({roundMatches.length} partido{roundMatches.length !== 1 ? 's' : ''})</span>
              </div>

              <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
                {roundMatches.map((m) => (
                  <AdminMatchRow key={m.id} match={m} editor={editor} onRefresh={onRefresh} />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Bracket tab ───────────────────────────────────────────────────────────────

function BracketTab({ matches, onRefresh }) {
  const editor = useMatchResultEditor(onRefresh)
  const [selectedNum, setSelectedNum] = useState(null)

  const knockout = useMemo(
    () => matches.filter((m) => m.match_number != null && m.match_number >= 73),
    [matches],
  )

  const selected = useMemo(
    () => knockout.find((m) => m.match_number === selectedNum) ?? null,
    [knockout, selectedNum],
  )

  const handleSelect = (match) => {
    setSelectedNum((n) => (n === match.match_number ? null : match.match_number))
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-4 text-sm"
        style={{ background: 'rgba(180,120,0,0.1)', border: '1px solid rgba(180,120,0,0.2)' }}
      >
        <p className="font-semibold text-amber-400 mb-1">Cuadro eliminatorio</p>
        <p className="text-amber-400/70">
          Vista en árbol: el ganador avanza hacia el centro. Haz clic en un cruce para cargar marcador,
          alargue, penales y ver predicciones.
        </p>
      </div>

      <div
        className="rounded-2xl p-4 md:p-6"
        style={{ background: 'rgba(17,17,17,0.92)', border: '1px solid #1e1e1e' }}
      >
        <BracketDiagram
          matches={knockout}
          selectedMatchNum={selected?.match_number ?? null}
          onSelectMatch={handleSelect}
        />
      </div>

      {selected && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#111111', border: '1px solid rgba(45,212,191,0.35)' }}
        >
          <div
            className="px-4 py-2 flex items-center justify-between gap-2"
            style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}
          >
            <span className="text-sm font-bold text-teal-400">
              P{selected.match_number} · {selected.round_name}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-white/40 hover:text-white/70 px-2 py-1"
            >
              Cerrar ✕
            </button>
          </div>
          <AdminMatchRow
            match={selected}
            editor={editor}
            onRefresh={onRefresh}
            showDelete={false}
          />
        </div>
      )}
    </div>
  )
}

// ── Main AdminPage ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState('manage')
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
  const finished = matches.filter((m) => matchStatus(m) === 'finished').length

  // Count TBD knockout matches for bracket badge
  const tbdKnockout = matches.filter(
    (m) => m.match_number >= 73 && (isTBD(m.home_team) || isTBD(m.away_team)),
  ).length

  const pageBg = {
    backgroundImage: 'url(/stadium.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  if (loading)
    return (
      <div className="min-h-screen stadium-bg" style={pageBg}>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        </div>
      </div>
    )

  return (
    <div className="min-h-screen stadium-bg" style={pageBg}>
      <div className="min-h-screen" style={{ background: 'rgba(0,0,0,0.55)' }}>
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-white">Panel de Administración</h1>
          <p className="text-on-dark-muted text-xs sm:text-sm mt-0.5">Gestiona los partidos y resultados del torneo</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 text-sm text-on-dark-muted hover:text-on-dark px-3 sm:px-4 py-2 rounded-xl transition-colors font-medium shrink-0"
          style={{ background: '#111111', border: '1px solid #2a2a2a' }}>
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <StatCard value={total}    label="Total"         color="blue" />
        <StatCard value={open}     label="Sin resultado" color="amber" />
        <StatCard value={finished} label="Con resultado" color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-full" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
        <TabBtn active={tab === 'manage'} onClick={() => setTab('manage')}>
          <span className="sm:hidden">Gestionar {total > 0 && `(${total})`}</span>
          <span className="hidden sm:inline">Gestionar partidos {total > 0 && `(${total})`}</span>
        </TabBtn>
        <TabBtn active={tab === 'bracket'} onClick={() => setTab('bracket')}>
          <span className="sm:hidden">Bracket</span>
          <span className="hidden sm:inline">Bracket eliminatorias</span>
          {tbdKnockout > 0 && (
            <span className="ml-1.5 bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-black px-1.5 py-0.5 rounded-full">
              {tbdKnockout}
            </span>
          )}
        </TabBtn>
      </div>

      {/* Tab content */}
      {tab === 'manage' && (
        <MatchListTab matches={matches} onRefresh={load} />
      )}
      {tab === 'bracket' && (
        <BracketTab matches={matches} onRefresh={load} />
      )}
    </div>
      </div>
    </div>
  )
}
