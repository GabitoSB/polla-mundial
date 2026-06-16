/** Nombres de fase posibles en la app (el más largo define el header). */
const ROUND_NAMES = [
  'Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F',
  'Grupo G', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K', 'Grupo L',
  'Dieciseisavos', 'Octavos de Final', 'Cuartos de Final',
  'Semifinal', 'Tercer Puesto', 'Final',
]

const DATE_FMT = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
}

/** Fecha más larga del torneo (jun–jul 2026) con el mismo formato que MatchCard. */
function longestFormattedDate() {
  let max = ''
  for (let month = 5; month <= 7; month += 1) {
    for (let day = 1; day <= 31; day += 1) {
      const dt = new Date(2026, month, day, 15, 30)
      if (dt.getMonth() !== month) continue
      const s = dt.toLocaleString('es-MX', DATE_FMT)
      if (s.length > max.length) max = s
    }
  }
  return max
}

/** Píxeles según clases Tailwind reales de MatchCard (sm+). */
const PX = {
  cardPadX: 32,
  teamCol: 96,
  scoreInput: 56,
  scoreGap: 8,
  scoreDash: 16,
  badge: 44,
  hGap: 8,
  xsChar: 6.5,
}

function bodyWidthPx() {
  return (
    PX.cardPadX
    + PX.teamCol * 2
    + PX.scoreInput * 2
    + PX.scoreGap
    + PX.scoreDash
  )
}

function headerWidthPx() {
  const phase = ROUND_NAMES.reduce((a, b) => (a.length >= b.length ? a : b)).toUpperCase()
  const date = longestFormattedDate()
  return (
    PX.cardPadX
    + PX.badge
    + PX.hGap
    + phase.length * PX.xsChar
    + PX.hGap
    + date.length * PX.xsChar
  )
}

const MATCH_CARD_WIDTH_PX = Math.ceil(Math.max(bodyWidthPx(), headerWidthPx()))

/** Ancho fijo de tarjeta: sin crecer con 1fr. */
export const MATCH_CARD_WIDTH = `${(MATCH_CARD_WIDTH_PX / 17).toFixed(2)}rem`

/** Ancho y alto fijos de tarjeta para grilla uniforme. */
export const MATCH_CARD_WIDTH_CSS = {
  '--match-card-width': MATCH_CARD_WIDTH,
  '--match-card-height': '14.75rem',
}
