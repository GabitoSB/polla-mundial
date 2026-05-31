import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{ background: '#000000', borderBottom: '1px solid #1a1a1a' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-white">
          <div className="flex items-center gap-0.5">
            <img src="https://flagcdn.com/w20/mx.png" alt="México"        width="20" className="rounded-sm opacity-80" />
            <img src="https://flagcdn.com/w20/us.png" alt="Estados Unidos" width="20" className="rounded-sm opacity-80" />
            <img src="https://flagcdn.com/w20/ca.png" alt="Canadá"         width="20" className="rounded-sm opacity-80" />
          </div>
          <span className="text-base sm:text-lg leading-tight">
            Pulpo Paul
            <span className="hidden sm:inline text-white/30 font-normal"> · </span>
            <span className="hidden sm:inline text-white/60 font-normal">FIFA World Cup 2026</span>
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-5">
            <Link to="/" className="text-sm text-white/60 hover:text-white transition-colors">
              Partidos
            </Link>
            <Link to="/leaderboard" className="text-sm text-white/60 hover:text-white transition-colors">
              Tabla
            </Link>
            {user.is_admin && (
              <Link to="/admin" className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-semibold">
                Admin
              </Link>
            )}
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid #222' }}>
              <span className="text-sm text-white/50">
                {user.username}
                {user.is_admin && <span className="ml-1.5 text-xs bg-teal-500/20 text-teal-400 border border-teal-500/30 px-1.5 py-0.5 rounded font-semibold">ADMIN</span>}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-white/40 hover:text-white/80 px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: '1px solid #2a2a2a' }}
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
