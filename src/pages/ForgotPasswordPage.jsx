import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'No se pudo enviar el correo. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
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
            Recuperar contraseña
          </p>
          <p className="text-gray-500 mb-8 text-base">
            {sent
              ? 'Revisa tu bandeja de entrada (y spam) para continuar.'
              : 'Te enviaremos un enlace para restablecer tu contraseña.'}
          </p>

          {sent ? (
            <div className="space-y-6">
              <div
                className="border text-teal-300 text-sm px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,120,100,0.15)', borderColor: 'rgba(20,184,166,0.3)' }}
              >
                Si el email está registrado, recibirás un enlace válido por 60 minutos.
              </div>
              <Link
                to="/login"
                className="block w-full text-center font-bold py-4 rounded-xl text-lg tracking-wide transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00c9a7 0%, #0057ff 100%)',
                  boxShadow: '0 0 32px rgba(0,180,150,0.3)',
                }}
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-base font-bold text-gray-400 mb-2 uppercase tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-5 py-4 text-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  style={{ background: '#111111', border: '1px solid #222222' }}
                  placeholder="tu@email.com"
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
                className="w-full font-bold py-4 rounded-xl text-lg tracking-wide transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #00c9a7 0%, #0057ff 100%)',
                  boxShadow: '0 0 32px rgba(0,180,150,0.3)',
                }}
              >
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}

          {!sent && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid #181818' }}>
              <p className="text-gray-500 text-base">
                <Link to="/login" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
