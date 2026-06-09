import { useRef, useState } from 'react'
import { deleteAvatar, uploadAvatar } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import UserAvatar from './UserAvatar'

export default function ProfileAvatarButton({ username, avatarUrl, size = 'md' }) {
  const { updateUser } = useAuth()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [cacheBust, setCacheBust] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const { data } = await uploadAvatar(file)
      updateUser(data)
      setCacheBust(Date.now())
    } catch (err) {
      setError(err.response?.data?.detail ?? 'No se pudo subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    setError(null)
    try {
      const { data } = await deleteAvatar()
      updateUser(data)
      setCacheBust(Date.now())
    } catch (err) {
      setError(err.response?.data?.detail ?? 'No se pudo quitar la foto')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-60"
        title="Cambiar foto de perfil"
        aria-label="Cambiar foto de perfil"
      >
        <UserAvatar
          username={username}
          avatarUrl={avatarUrl}
          size={size}
          cacheBust={cacheBust}
        />
        <span className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {avatarUrl && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 text-white text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900 hover:border-red-700"
          title="Quitar foto"
          aria-label="Quitar foto de perfil"
        >
          ×
        </button>
      )}

      {error && (
        <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[12rem] text-[10px] text-red-400 text-center z-10">
          {error}
        </p>
      )}
    </div>
  )
}
