import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const passwordMismatch = form.confirm.length > 0 && form.password !== form.confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setError('El enlace de recuperación no es válido.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await resetPassword(token, form.password)
      navigate('/login', { state: { passwordReset: true } })
    } catch (e) {
      setError(e.response?.data?.detail ?? 'No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#000000' }}>
        <div className="w-full max-w-sm text-center">
          <p className="text-red-400 mb-6">El enlace de recuperación no es válido o expiró.</p>
          <Link to="/forgot-password" className="text-teal-400 hover:text-teal-300 font-bold">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#000000' }}>
      <div className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden" style={{ background: '#000000' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,210,170,0.14) 0%, rgba(0,90,255,0.09) 45%, transparent 72%)',
          }}
        />
        <img
          src="/logo-pulpo.png"
          alt="Pulpo Paul FIFA World Cup 2026"
          className="relative z-10 max-h-[75vh] w-auto"
        />
      </div>

      <div className="hidden md:block w-px" style={{ background: 'linear-gradient(to bottom, #000, rgba(255,255,255,0.07) 25%, rgba(255,255,255,0.07) 75%, #000)' }} />

      <div className="flex-1 flex flex-col items-center justify-center px-10" style={{ background: '#000000' }}>
        <img
          src="/logo-pulpo.png"
          alt="Pulpo Paul FIFA World Cup 2026"
          className="md:hidden w-48 mb-8"
        />

        <div className="w-full max-w-sm">
          <p className="text-sm font-bold text-teal-400 tracking-[0.25em] uppercase mb-2">
            Nueva contraseña
          </p>
          <p className="text-gray-500 mb-8 text-base">Elige una contraseña nueva para tu cuenta.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-base font-bold text-gray-400 mb-2 uppercase tracking-widest">
                Contraseña nueva
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl px-5 py-4 pr-12 text-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  style={{ background: '#111111', border: '1px solid #222222' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-gray-400 mb-2 uppercase tracking-widest">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="w-full rounded-xl px-5 py-4 pr-12 text-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  style={{
                    background: '#111111',
                    border: passwordMismatch ? '1px solid rgba(220,50,50,0.6)' : '1px solid #222222',
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {passwordMismatch && (
                <p className="text-red-400 text-sm mt-2">Las contraseñas no coinciden</p>
              )}
            </div>

            {error && (
              <div className="border text-red-400 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(127,0,0,0.2)', borderColor: 'rgba(200,50,50,0.3)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="w-full font-bold py-4 rounded-xl text-lg tracking-wide transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #00c9a7 0%, #0057ff 100%)',
                boxShadow: '0 0 32px rgba(0,180,150,0.3)',
              }}
            >
              {loading ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #181818' }}>
            <p className="text-gray-500 text-base">
              <Link to="/login" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
                ← Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
