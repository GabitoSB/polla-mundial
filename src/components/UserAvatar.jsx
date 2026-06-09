import { avatarFullUrl, AVATAR_SIZES, getAvatarColorClass, getUsernameInitial } from '../utils/avatar'

export default function UserAvatar({
  username,
  avatarUrl,
  size = 'md',
  className = '',
  cacheBust,
}) {
  const sizeClass = AVATAR_SIZES[size] ?? AVATAR_SIZES.md
  const src = avatarFullUrl(avatarUrl, cacheBust)
  const initial = getUsernameInitial(username)
  const colorClass = getAvatarColorClass(username)

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br ${colorClass} ${sizeClass} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  )
}
