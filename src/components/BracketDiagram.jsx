import { useMemo } from 'react'
import { MUNDIAL_COUNTRIES } from '../constants/countries'

const isoOf = (name) => MUNDIAL_COUNTRIES.find((c) => c.name === name)?.iso ?? null

function FlagImg({ name, size = 16 }) {
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

const isTBD = (name) =>
  !name || /^(ganador|perdedor|1[°º]|2[°º]|3[°º])/i.test(name.trim())

function shortTeam(name) {
  if (!name) return '—'
  if (isTBD(name)) {
    const m = name.match(/P(\d+)/i)
    return m ? `P${m[1]}` : name.length > 14 ? `${name.slice(0, 12)}…` : name
  }
  return name.length > 16 ? `${name.slice(0, 14)}…` : name
}

function winnerSide(match) {
  if (match?.home_score == null || match?.away_score == null) return null
  if (match.home_score > match.away_score) return 'home'
  if (match.away_score > match.home_score) return 'away'
  if (match.penalty_winner === match.home_team) return 'home'
  if (match.penalty_winner === match.away_team) return 'away'
  return null
}

const LEFT_R32 = [74, 77, 73, 75, 83, 84, 81, 82]
const LEFT_R16 = [89, 90, 93, 94]
const LEFT_QF = [97, 98]
const LEFT_SF = 101

const RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87]
const RIGHT_R16 = [91, 92, 95, 96]
const RIGHT_QF = [99, 100]
const RIGHT_SF = 102

const GRID_COLS = 9
const GRID_ROWS = 8

const PHASE_LABELS = [
  'Dieciseisavos',
  'Octavos',
  'Cuartos',
  'Semifinal',
  'Final',
  'Semifinal',
  'Cuartos',
  'Octavos',
  'Dieciseisavos',
]

function buildPlacements(nums, col, rowSpan) {
  return nums.map((num, i) => ({
    num,
    col,
    rowStart: i * rowSpan + 1,
    rowEnd: i * rowSpan + rowSpan + 1,
  }))
}

const BRACKET_PLACEMENTS = [
  ...buildPlacements(LEFT_R32, 1, 1),
  ...buildPlacements(LEFT_R16, 2, 2),
  ...buildPlacements(LEFT_QF, 3, 4),
  { num: LEFT_SF, col: 4, rowStart: 1, rowEnd: 9 },
  { num: 103, col: 5, rowStart: 1, rowEnd: 3, label: '3.er puesto' },
  { num: 104, col: 5, rowStart: 3, rowEnd: 7, label: 'Final' },
  { num: RIGHT_SF, col: 6, rowStart: 1, rowEnd: 9 },
  ...buildPlacements(RIGHT_QF, 7, 4),
  ...buildPlacements(RIGHT_R16, 8, 2),
  ...buildPlacements(RIGHT_R32, 9, 1),
]

const placementOf = (num) => BRACKET_PLACEMENTS.find((p) => p.num === num)

/** Vertical center of a match in SVG coords (viewBox height = GRID_ROWS). */
function placementY(p) {
  return (p.rowStart + p.rowEnd - 1) / 2 - 0.5
}

/** Pairs of feeders → parent (same tree as backend _WINNER_SLOT). */
const BRACKET_LINKS = [
  { c1: 74, c2: 77, p: 89, side: 'left' },
  { c1: 73, c2: 75, p: 90, side: 'left' },
  { c1: 83, c2: 84, p: 93, side: 'left' },
  { c1: 81, c2: 82, p: 94, side: 'left' },
  { c1: 89, c2: 90, p: 97, side: 'left' },
  { c1: 93, c2: 94, p: 98, side: 'left' },
  { c1: 97, c2: 98, p: 101, side: 'left' },
  { c1: 76, c2: 78, p: 91, side: 'right' },
  { c1: 79, c2: 80, p: 92, side: 'right' },
  { c1: 86, c2: 88, p: 95, side: 'right' },
  { c1: 85, c2: 87, p: 96, side: 'right' },
  { c1: 91, c2: 92, p: 99, side: 'right' },
  { c1: 95, c2: 96, p: 100, side: 'right' },
  { c1: 99, c2: 100, p: 102, side: 'right' },
  { c1: 101, c2: 102, p: 104, side: 'center' },
]

function pathForLink({ c1, c2, p, side }) {
  const a = placementOf(c1)
  const b = placementOf(c2)
  const parent = placementOf(p)
  if (!a || !b || !parent) return ''

  const ya = placementY(a)
  const yb = placementY(b)
  const ym = (ya + yb) / 2

  if (side === 'left') {
    const xOut = a.col
    const xJ = a.col + 0.5
    const xIn = parent.col - 1
    return [
      `M ${xOut} ${ya} H ${xJ}`,
      `M ${xOut} ${yb} H ${xJ}`,
      `M ${xJ} ${ya} V ${yb}`,
      `M ${xJ} ${ym} H ${xIn}`,
    ].join(' ')
  }

  if (side === 'right') {
    const xOut = a.col - 1
    const xJ = a.col - 0.5
    const xIn = parent.col
    return [
      `M ${xOut} ${ya} H ${xJ}`,
      `M ${xOut} ${yb} H ${xJ}`,
      `M ${xJ} ${ya} V ${yb}`,
      `M ${xJ} ${ym} H ${xIn}`,
    ].join(' ')
  }

  // Semifinales → Final (centro)
  const yp = placementY(parent)
  const xJ = 4.75
  return [
    `M 4 ${ya} H ${xJ}`,
    `M 5 ${yb} H ${xJ}`,
    `M ${xJ} ${ya} V ${yb}`,
    `M ${xJ} ${yp} H 4`,
  ].join(' ')
}

function BracketConnectors() {
  const paths = BRACKET_LINKS.map((link) => pathForLink(link)).filter(Boolean)

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${GRID_COLS} ${GRID_ROWS}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="0.065"
        />
      ))}
    </svg>
  )
}

function TeamSlot({ name, side, winner, score, isSelected }) {
  const tbd = isTBD(name)
  const isWinner = winner === side
  const isLoser = winner && winner !== side

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 min-h-[26px] border-b last:border-b-0 transition-colors ${
        isSelected ? 'ring-1 ring-teal-400/50 ring-inset' : ''
      }`}
      style={{
        background: isWinner
          ? 'rgba(16,185,129,0.22)'
          : isLoser
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.06)',
        opacity: isLoser ? 0.45 : 1,
      }}
    >
      {!tbd && <FlagImg name={name} size={14} />}
      <span
        className={`flex-1 text-[11px] font-bold leading-tight truncate ${
          tbd ? 'italic text-white/30' : isWinner ? 'text-emerald-100' : 'text-white/85'
        }`}
        title={name}
      >
        {shortTeam(name)}
      </span>
      {score != null && (
        <span className={`text-xs font-black tabular-nums ${isWinner ? 'text-emerald-300' : 'text-white/50'}`}>
          {score}
        </span>
      )}
    </div>
  )
}

function BracketMatchCell({ match, placement, selectedNum, onSelect }) {
  if (!match) return null

  const winner = winnerSide(match)
  const finished = match.home_score != null
  const selected = selectedNum === match.match_number

  return (
    <div
      className="relative z-10 flex items-center my-auto px-0.5"
      style={{
        gridColumn: placement.col,
        gridRow: `${placement.rowStart} / ${placement.rowEnd}`,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(match)}
        className={`w-full text-left rounded-md overflow-hidden transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-teal-500/60 ${
          selected ? 'ring-2 ring-teal-400 shadow-lg shadow-teal-900/30' : ''
        }`}
        style={{
          border: selected
            ? '1px solid rgba(45,212,191,0.6)'
            : finished
              ? '1px solid rgba(16,185,129,0.35)'
              : '1px solid rgba(255,255,255,0.12)',
          boxShadow: selected ? '0 0 20px rgba(0,200,150,0.15)' : undefined,
          background: 'rgba(12,12,12,0.92)',
        }}
      >
        <div
          className="px-2 py-0.5 flex items-center justify-between gap-1"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
          <span className="text-[9px] font-bold text-white/35">P{match.match_number}</span>
          {placement.label && (
            <span className="text-[9px] font-bold text-amber-400/80 uppercase">{placement.label}</span>
          )}
          {!placement.label && (
            <span
              className={`text-[9px] font-semibold px-1 rounded ${
                finished ? 'text-emerald-400/90' : 'text-amber-400/70'
              }`}
            >
              {finished ? '✓' : '·'}
            </span>
          )}
        </div>
        <TeamSlot
          name={match.home_team}
          side="home"
          winner={winner}
          score={finished ? match.home_score : null}
          isSelected={selected}
        />
        <TeamSlot
          name={match.away_team}
          side="away"
          winner={winner}
          score={finished ? match.away_score : null}
          isSelected={selected}
        />
      </button>
    </div>
  )
}

export default function BracketDiagram({ matches, selectedMatchNum, onSelectMatch }) {
  const byNum = useMemo(() => {
    const map = {}
    for (const m of matches) {
      if (m.match_number != null && m.match_number >= 73) map[m.match_number] = m
    }
    return map
  }, [matches])

  const done = Object.values(byNum).filter((m) => m.home_score != null).length
  const total = Object.keys(byNum).length

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 text-center">
        Haz clic en un cruce para cargar o corregir el resultado · {done}/{total} con marcador
      </p>

      <div className="overflow-x-auto pb-2">
        <div
          className="mx-auto min-w-[920px] max-w-[1100px] px-2 py-4 rounded-xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(34px, 1fr)) auto`,
            columnGap: 0,
            rowGap: '6px',
            minHeight: '440px',
            background: 'linear-gradient(180deg, rgba(80,20,30,0.45) 0%, rgba(40,12,18,0.55) 100%)',
          }}
        >
          <div
            className="relative min-h-0 pointer-events-none"
            style={{ gridColumn: '1 / -1', gridRow: `1 / ${GRID_ROWS + 1}`, zIndex: 0 }}
          >
            <BracketConnectors />
          </div>

          {BRACKET_PLACEMENTS.map((p) => (
            <BracketMatchCell
              key={p.num}
              match={byNum[p.num]}
              placement={p}
              selectedNum={selectedMatchNum}
              onSelect={onSelectMatch}
            />
          ))}

          {PHASE_LABELS.map((label, i) => (
            <div
              key={`phase-${i}`}
              className={`relative z-10 text-center text-[10px] font-semibold uppercase tracking-wide pt-2 pb-1 leading-tight ${
                i === 4 ? 'text-amber-400/70' : 'text-white/30'
              }`}
              style={{ gridColumn: i + 1, gridRow: GRID_ROWS + 1 }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
