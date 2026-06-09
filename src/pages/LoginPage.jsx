import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { saveLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const passwordResetSuccess = location.state?.passwordReset
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await login(form.username, form.password)
      localStorage.setItem('token', data.access_token)
      const { data: me } = await getMe()
      saveLogin(data.access_token, me)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#000000' }}>

      {/* ── Panel izquierdo: logo ── */}
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
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
          <img src="https://flagcdn.com/w20/mx.png" width="24" alt="México" className="rounded opacity-50" />
          <img src="https://flagcdn.com/w20/us.png" width="24" alt="USA" className="rounded opacity-50" />
          <img src="https://flagcdn.com/w20/ca.png" width="24" alt="Canadá" className="rounded opacity-50" />
          <span className="text-white/25 text-xs tracking-[0.25em] uppercase">Hosts 2026</span>
        </div>
      </div>

      {/* Divisor */}
      <div className="hidden md:block w-px" style={{ background: 'linear-gradient(to bottom, #000, rgba(255,255,255,0.07) 25%, rgba(255,255,255,0.07) 75%, #000)' }} />

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-10" style={{ background: '#000000' }}>

        {/* Logo solo en móvil */}
        <img
          src="/logo-pulpo.png"
          alt="Pulpo Paul FIFA World Cup 2026"
          className="md:hidden w-48 mb-8"
        />

        <div className="w-full max-w-sm">
          <p className="text-sm font-bold text-teal-400 tracking-[0.25em] uppercase mb-2">
            FIFA World Cup 2026
          </p>
          <p className="text-gray-500 mb-8 text-base">Ingresa para enviar tus predicciones</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-base font-bold text-gray-400 mb-2 uppercase tracking-widest">
                Usuario o email
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-xl px-5 py-4 text-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                style={{ background: '#111111', border: '1px solid #222222' }}
                placeholder="tu_usuario"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-400 mb-2 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
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
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="text-right -mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-teal-400/90 hover:text-teal-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {passwordResetSuccess && (
              <div
                className="border text-teal-300 text-sm px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,120,100,0.15)', borderColor: 'rgba(20,184,166,0.3)' }}
              >
                Contraseña actualizada. Ya puedes iniciar sesión.
              </div>
            )}

            {error && (
              <div className="border text-red-400 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(127,0,0,0.2)', borderColor: 'rgba(200,50,50,0.3)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-4 rounded-xl text-lg tracking-wide transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #00c9a7 0%, #0057ff 100%)',
                boxShadow: '0 0 32px rgba(0,180,150,0.3)',
              }}
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #181818' }}>
            <p className="text-gray-500 text-base">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
                Registrarse
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
