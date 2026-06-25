import { avatarFullUrl } from './avatar'

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timeout = setTimeout(() => reject(new Error('timeout')), 10000)
    img.onload = () => {
      clearTimeout(timeout)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 64
        canvas.height = img.naturalHeight || 64
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('load_failed'))
    }
    img.src = url
  })
}

async function fetchAsDataUrl(url) {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error('fetch_failed')
  const blob = await res.blob()
  if (!blob.size) throw new Error('empty')
  return blobToDataUrl(blob)
}

/** Descarga fotos de perfil → data URL para html2canvas. */
export async function preloadAvatarDataUrls(entries) {
  const map = {}
  const visibleImgs = document.querySelectorAll('.leaderboard-visible-table tbody tr img')

  await Promise.all(
    entries.map(async (entry, idx) => {
      if (!entry.avatar_url) return
      const apiUrl = avatarFullUrl(entry.avatar_url)
      const visibleUrl = visibleImgs[idx]?.src
      const candidates = [...new Set([visibleUrl, apiUrl].filter(Boolean))]

      for (const url of candidates) {
        try {
          map[String(entry.user_id)] = await loadImageAsDataUrl(url)
          return
        } catch {
          try {
            map[String(entry.user_id)] = await fetchAsDataUrl(url)
            return
          } catch {
            /* siguiente candidato */
          }
        }
      }
    }),
  )
  return map
}
