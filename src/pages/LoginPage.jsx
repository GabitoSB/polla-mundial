import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { saveLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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
          className="md:hidden w-64 mb-10"
        />

        <div className="w-full max-w-sm">
          <p className="text-xs font-bold text-teal-400 tracking-[0.25em] uppercase mb-3">
            FIFA World Cup 2026
          </p>
          <h2 className="text-4xl font-black text-white leading-tight mb-2">
            Bienvenido<br />de vuelta
          </h2>
          <p className="text-gray-600 mb-12">Ingresá para enviar tus predicciones</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-widest">
                Usuario o email
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-xl px-5 py-4 text-base text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                style={{ background: '#111111', border: '1px solid #222222' }}
                placeholder="tu_usuario"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-widest">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl px-5 py-4 text-base text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                style={{ background: '#111111', border: '1px solid #222222' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border text-red-400 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(127,0,0,0.2)', borderColor: 'rgba(200,50,50,0.3)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-4 rounded-xl text-base tracking-wide transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #00c9a7 0%, #0057ff 100%)',
                boxShadow: '0 0 32px rgba(0,180,150,0.3)',
              }}
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-10 pt-8" style={{ borderTop: '1px solid #181818' }}>
            <p className="text-gray-700">
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
