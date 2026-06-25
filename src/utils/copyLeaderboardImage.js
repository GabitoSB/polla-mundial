import { copyCanvasImage } from './copyCanvasImage'
import { renderLeaderboardCanvas } from './renderLeaderboardCanvas'

/** Genera la imagen de la tabla dibujando en canvas (sin html2canvas ni DOM oculto). */
export async function copyLeaderboardImage({ entries, avatarSrcByUserId, dateLabel }) {
  const canvas = await renderLeaderboardCanvas({ entries, avatarSrcByUserId, dateLabel })
  return copyCanvasImage(canvas, 'tabla-pulpo-paul.png')
}
