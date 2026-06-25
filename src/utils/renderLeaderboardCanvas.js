import { getUsernameInitial } from './avatar'

const AVATAR_BG = ['#14b8a6', '#2563eb', '#7c3aed', '#e11d48', '#d97706', '#059669']
const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function avatarBg(username) {
  let hash = 0
  for (let i = 0; i < (username?.length ?? 0); i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_BG[Math.abs(hash) % AVATAR_BG.length]
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawCircleAvatar(ctx, x, y, size, username) {
  const cx = x + size / 2
  const cy = y + size / 2
  const r = size / 2

  ctx.fillStyle = avatarBg(username)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${Math.round(size * 0.44)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(getUsernameInitial(username), cx, cy)
}

function drawPhotoAvatar(ctx, img, x, y, size) {
  const cx = x + size / 2
  const cy = y + size / 2
  const r = size / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(img, x, y, size, size)
  ctx.restore()
}

/**
 * Dibuja la tabla en canvas desde los datos.
 * Misma salida en todos los dispositivos; escala solo para nitidez (retina).
 */
export async function renderLeaderboardCanvas({ entries, avatarSrcByUserId = {}, dateLabel }) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = 640

  const avatarSize = 32
  const rowH = avatarSize + 28
  const titleH = 76
  const theadH = 40

  const colRank = 44
  const colPts = 56
  const colExact = 72
  const colPartial = 72
  const colJugador = W - colRank - colPts - colExact - colPartial
  const cols = [
    { x: 0, w: colRank },
    { x: colRank, w: colJugador },
    { x: colRank + colJugador, w: colPts },
    { x: colRank + colJugador + colPts, w: colExact },
    { x: colRank + colJugador + colPts + colExact, w: colPartial },
  ]

  const H = titleH + theadH + entries.length * rowH

  const avatarImgs = {}
  await Promise.all(
    entries.map(async (entry) => {
      const src = avatarSrcByUserId[String(entry.user_id)]
      if (!src) return
      try {
        avatarImgs[entry.user_id] = await loadImage(src)
      } catch {
        /* inicial de respaldo */
      }
    }),
  )

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Título
  ctx.textAlign = 'center'
  ctx.fillStyle = '#0f172a'
  ctx.font = `900 18px ${FONT}`
  ctx.fillText('Pulpo Paul', W / 2, 24)

  ctx.fillStyle = '#64748b'
  ctx.font = `700 11px ${FONT}`
  ctx.fillText('TABLA DE POSICIONES', W / 2, 44)

  ctx.fillStyle = '#94a3b8'
  ctx.font = `400 12px ${FONT}`
  ctx.fillText(dateLabel, W / 2, 62)

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, titleH)
  ctx.lineTo(W, titleH)
  ctx.stroke()

  // Cabecera tabla
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(0, titleH, W, theadH)
  ctx.strokeRect(0, titleH, W, theadH)

  const headY = titleH + theadH / 2
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#64748b'
  ctx.font = `700 12px ${FONT}`

  const headers = [
    { text: '#', align: 'left', pad: 16 },
    { text: 'Jugador', align: 'left', pad: 16 },
    { text: 'Pts', align: 'right', pad: 16 },
    { text: 'Exactos', align: 'right', pad: 16 },
    { text: 'Parciales', align: 'right', pad: 16 },
  ]

  headers.forEach((h, i) => {
    ctx.textAlign = h.align
    const hx = h.align === 'right' ? cols[i].x + cols[i].w - h.pad : cols[i].x + h.pad
    ctx.fillText(h.text, hx, headY)
  })

  // Filas
  entries.forEach((entry, idx) => {
    const y = titleH + theadH + idx * rowH
    const midY = y + rowH / 2

    if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, y, W, rowH)
    }

    ctx.strokeStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.moveTo(0, y + rowH)
    ctx.lineTo(W, y + rowH)
    ctx.stroke()

    // #
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#94a3b8'
    ctx.font = `700 16px ${FONT}`
    ctx.fillText(String(entry.rank), cols[0].x + 16, midY)

    // Avatar + nombre
    const avatarX = cols[1].x + 16
    const avatarY = y + (rowH - avatarSize) / 2
    const photo = avatarImgs[entry.user_id]
    if (photo) {
      drawPhotoAvatar(ctx, photo, avatarX, avatarY, avatarSize)
    } else {
      drawCircleAvatar(ctx, avatarX, avatarY, avatarSize, entry.username)
    }

    ctx.textAlign = 'left'
    ctx.fillStyle = '#1e293b'
    ctx.font = `500 16px ${FONT}`
    ctx.fillText(entry.username, avatarX + avatarSize + 10, midY)

    // Pts
    ctx.textAlign = 'right'
    ctx.fillStyle = '#0f172a'
    ctx.font = `900 16px ${FONT}`
    ctx.fillText(String(entry.total_points), cols[2].x + cols[2].w - 16, midY)

    // Exactos
    ctx.fillStyle = '#059669'
    ctx.font = `700 16px ${FONT}`
    ctx.fillText(String(entry.exact_results), cols[3].x + cols[3].w - 16, midY)

    // Parciales
    ctx.fillStyle = '#64748b'
    ctx.font = `600 16px ${FONT}`
    ctx.fillText(String(entry.partial_score_hits), cols[4].x + cols[4].w - 16, midY)
  })

  return canvas
}
