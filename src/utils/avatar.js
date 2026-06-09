const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const AVATAR_COLORS = [
  'from-teal-500 to-cyan-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-green-600',
]

export function getUsernameInitial(username) {
  return (username?.trim()?.[0] ?? '?').toUpperCase()
}

export function getAvatarColorClass(username) {
  let hash = 0
  for (let i = 0; i < (username?.length ?? 0); i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function avatarFullUrl(avatarUrl, cacheBust) {
  if (!avatarUrl) return null
  const url = avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}`
  return cacheBust ? `${url}?t=${cacheBust}` : url
}

export const AVATAR_SIZES = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}
