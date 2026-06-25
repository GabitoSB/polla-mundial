import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const LINE_COLORS = [
  '#fbbf24', '#e2e8f0', '#4ade80', '#fb923c', '#38bdf8',
  '#3b82f6', '#f472b6', '#2dd4bf', '#a78bfa', '#f87171',
  '#fcd34d', '#86efac', '#93c5fd', '#fda4af', '#c4b5fd',
  '#67e8f9', '#bef264', '#fdba74', '#e879f9', '#34d399',
  '#60a5fa', '#facc15', '#fb7185', '#a3e635', '#22d3ee',
]

function colorForIndex(i) {
  if (i < LINE_COLORS.length) return LINE_COLORS[i]
  const hue = (i * 47) % 360
  return `hsl(${hue} 70% 62%)`
}

function formatSnapshotDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildSnapshotEntries(row, players, colorById) {
  return players
    .map((player) => ({
      user_id: player.user_id,
      username: player.username,
      rank: row[`u${player.user_id}`],
      points: row[`u${player.user_id}_pts`] ?? 0,
      color: colorById[player.user_id],
    }))
    .sort((a, b) => a.rank - b.rank)
}

function SnapshotStandingsPanel({
  snapshot,
  entries,
  currentUserId,
  highlightedId,
  focusMode,
  onHoverPlayer,
  onSelectPlayer,
}) {
  const dateStr = snapshot?.date ? formatSnapshotDate(snapshot.date) : null

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-xl overflow-hidden lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
      <div className="shrink-0 px-4 py-3 border-b border-white/10">
        <p className="text-[10px] font-bold text-white/45 uppercase tracking-widest">
          Tabla en este momento
        </p>
        <p className="text-lg font-black text-white mt-0.5">{snapshot?.label ?? '—'}</p>
        {dateStr && <p className="text-xs text-white/45 mt-0.5">{dateStr}</p>}
        <p className="text-[11px] text-white/35 mt-1.5 leading-snug">
          {focusMode
            ? 'Clic de nuevo para volver a la vista general'
            : 'Clic en un jugador para destacar su línea'}
        </p>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2 min-h-[12rem]">
        {entries.map((entry) => {
          const isMe = entry.user_id === currentUserId
          const isHighlighted = highlightedId === entry.user_id
          return (
            <li
              key={entry.user_id}
              onMouseEnter={() => onHoverPlayer(entry.user_id)}
              onMouseLeave={() => onHoverPlayer(null)}
              onClick={() => onSelectPlayer(entry.user_id)}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all cursor-pointer ${
                focusMode && isHighlighted
                  ? 'bg-white/15 ring-1 ring-white/25 scale-[1.02] shadow-lg shadow-black/30'
                  : focusMode && !isHighlighted
                    ? 'opacity-40'
                    : isMe
                      ? 'bg-teal-500/10 ring-1 ring-teal-500/20'
                      : 'hover:bg-white/5'
              }`}
            >
              <span
                className={`w-5 text-right font-bold tabular-nums text-xs shrink-0 ${
                  isHighlighted ? 'text-white' : 'text-white/40'
                }`}
              >
                {entry.rank}
              </span>
              <span
                className={`rounded-full shrink-0 transition-all ${
                  isHighlighted ? 'w-3 h-3 ring-2 ring-white/40' : 'w-2 h-2'
                }`}
                style={{ background: entry.color }}
              />
              <span
                className={`truncate flex-1 min-w-0 ${
                  isHighlighted
                    ? 'text-white font-bold'
                    : isMe
                      ? 'text-teal-200 font-semibold'
                      : 'text-white/85 font-medium'
                }`}
              >
                {entry.username}
              </span>
              <span
                className={`tabular-nums text-xs shrink-0 ${
                  isHighlighted ? 'text-white font-semibold' : 'text-white/55'
                }`}
              >
                {entry.points}p
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function LeaderboardChart({ history, currentUserId }) {
  const [metric, setMetric] = useState('rank')
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [snapshotIndex, setSnapshotIndex] = useState(0)

  const highlightedId = hoveredId ?? selectedId ?? null
  const focusMode = highlightedId != null

  const { players, rows, snapshots, colorById } = useMemo(() => {
    const players = history?.players ?? []
    const rows = history?.rows ?? []
    const snapshots = history?.snapshots ?? []
    const colorById = Object.fromEntries(
      players.map((p, i) => [p.user_id, colorForIndex(i)]),
    )
    return { players, rows, snapshots, colorById }
  }, [history])

  useEffect(() => {
    if (rows.length > 0) setSnapshotIndex(rows.length - 1)
  }, [rows.length])

  const maxRank = useMemo(() => {
    if (!rows.length || !players.length) return 1
    let max = 1
    for (const row of rows) {
      for (const p of players) {
        const v = row[`u${p.user_id}`]
        if (v != null && v > max) max = v
      }
    }
    return max
  }, [rows, players])

  const maxPoints = useMemo(() => {
    if (!rows.length || !players.length) return 1
    let max = 0
    for (const row of rows) {
      for (const p of players) {
        const v = row[`u${p.user_id}_pts`]
        if (v != null && v > max) max = v
      }
    }
    return Math.max(max, 1)
  }, [rows, players])

  const activeSnapshot = snapshots[snapshotIndex] ?? snapshots[snapshots.length - 1]
  const activeRow = rows[snapshotIndex] ?? rows[rows.length - 1]
  const snapshotEntries = activeRow
    ? buildSnapshotEntries(activeRow, players, colorById)
    : []

  const playersDrawOrder = useMemo(() => {
    if (!highlightedId) return players
    const rest = players.filter((p) => p.user_id !== highlightedId)
    const focus = players.find((p) => p.user_id === highlightedId)
    return focus ? [...rest, focus] : players
  }, [players, highlightedId])

  if (!players.length) return null

  if (rows.length < 2) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md px-4 py-8 text-center text-white/60 text-sm">
        El gráfico aparecerá cuando se registren resultados de partidos.
      </div>
    )
  }

  const dataKeyFor = (userId) => (metric === 'rank' ? `u${userId}` : `u${userId}_pts`)
  const chartHeight = Math.min(480, 220 + players.length * 8)

  const renderPlayerLines = (player) => {
    const isHighlighted = focusMode && player.user_id === highlightedId
    const dimOthers = focusMode && !isHighlighted
    const color = colorById[player.user_id]
    const dataKey = dataKeyFor(player.user_id)

    const glowLine = isHighlighted ? (
      <Line
        key={`${player.user_id}-glow`}
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={14}
        strokeOpacity={0.28}
        dot={false}
        activeDot={false}
        connectNulls
        isAnimationActive={false}
      />
    ) : null

    const mainLine = (
      <Line
        key={player.user_id}
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={isHighlighted ? 5 : dimOthers ? 1 : 2}
        strokeOpacity={dimOthers ? 0.1 : 1}
        dot={
          isHighlighted
            ? { r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }
            : { r: dimOthers ? 1.5 : 2.5, fill: color, strokeWidth: 0, fillOpacity: dimOthers ? 0.25 : 1 }
        }
        activeDot={
          isHighlighted
            ? { r: 7, fill: color, stroke: '#fff', strokeWidth: 2.5 }
            : { r: 4, fill: color, strokeWidth: 0 }
        }
        style={isHighlighted ? { filter: `drop-shadow(0 0 8px ${color})` } : undefined}
        connectNulls
        isAnimationActive={false}
      />
    )

    return glowLine ? [glowLine, mainLine] : [mainLine]
  }

  const toggleSelect = (userId) => {
    setSelectedId((prev) => (prev === userId ? null : userId))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-stretch">
      <div className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-xs text-white/45">
              Todos los jugadores · arrastra el cursor sobre el gráfico
            </p>
          </div>
          <div className="flex rounded-lg border border-white/15 overflow-hidden text-xs font-semibold shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetric('rank')}
              className={`px-3 py-1.5 transition-colors ${
                metric === 'rank' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              Posición
            </button>
            <button
              type="button"
              onClick={() => setMetric('points')}
              className={`px-3 py-1.5 transition-colors border-l border-white/10 ${
                metric === 'points' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              Puntos
            </button>
          </div>
        </div>

        <div className="px-2 pt-2 pb-1" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex != null) {
                  setSnapshotIndex(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setHoveredId(null)}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                tickLine={false}
                interval={0}
                angle={rows.length > 10 ? -40 : 0}
                textAnchor={rows.length > 10 ? 'end' : 'middle'}
                height={rows.length > 10 ? 48 : 30}
              />
              <YAxis
                reversed={metric === 'rank'}
                domain={metric === 'rank' ? [maxRank, 1] : [0, maxPoints]}
                allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                tickLine={false}
                width={28}
                tickFormatter={(v) => (metric === 'rank' ? `#${v}` : v)}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                content={() => null}
              />
              {playersDrawOrder.flatMap(renderPlayerLines)}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="px-3 py-2 border-t border-white/5 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-1">
            {snapshots.map((snap, idx) => (
              <button
                key={snap.key}
                type="button"
                onClick={() => setSnapshotIndex(idx)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold tabular-nums transition-colors ${
                  snapshotIndex === idx
                    ? 'bg-white/15 text-white'
                    : 'text-white/45 hover:text-white/75 hover:bg-white/5'
                }`}
              >
                {snap.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 pb-3 pt-0 flex flex-wrap gap-x-3 gap-y-1.5 justify-center border-t border-white/5">
          {players.map((player) => {
            const isMe = player.user_id === currentUserId
            const isHighlighted = focusMode && highlightedId === player.user_id
            const color = colorById[player.user_id]
            return (
              <button
                key={player.user_id}
                type="button"
                onClick={() => toggleSelect(player.user_id)}
                onMouseEnter={() => setHoveredId(player.user_id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium transition-all rounded-full px-2 py-0.5 ${
                  isHighlighted
                    ? 'opacity-100 bg-white/10 ring-1 ring-white/25 scale-105'
                    : focusMode
                      ? 'opacity-35'
                      : 'opacity-90 hover:opacity-100'
                } ${isMe ? 'text-white font-semibold' : 'text-white/70'}`}
              >
                <span
                  className={`rounded-full shrink-0 transition-all ${
                    isHighlighted ? 'w-3 h-3 ring-2 ring-white/30' : 'w-2.5 h-2.5'
                  }`}
                  style={{ background: color }}
                />
                <span className="truncate max-w-[8rem]">
                  {player.username}
                  {isMe && <span className="text-white/50 font-normal"> (tú)</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full lg:w-72 xl:w-80 shrink-0">
        <SnapshotStandingsPanel
          snapshot={activeSnapshot}
          entries={snapshotEntries}
          currentUserId={currentUserId}
          highlightedId={highlightedId}
          focusMode={focusMode}
          onHoverPlayer={setHoveredId}
          onSelectPlayer={toggleSelect}
        />
      </div>
    </div>
  )
}
