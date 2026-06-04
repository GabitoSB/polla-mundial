import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkCls  = ({ isActive }) => 'text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ' + (isActive ? 'text-white' : 'text-white/40 hover:text-white/70')
const navLinkStyle = ({ isActive }) => isActive ? { background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(59,130,246,0.35)' } : {}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{ background: '#000000', borderBottom: '1px solid #1a1a1a' }}>
      <div className="max-w-6xl mx-auto px-5 py-4 grid grid-cols-3 items-center">

        {/* Izquierda: vacío (balance) */}
        <div />

        {/* Centro: título + banderas */}
        <NavLink to="/" className="flex flex-col items-center leading-tight group" end>
          <span className="text-white font-black text-xl tracking-wide group-hover:text-white/80 transition-colors">
            Pulpo Paul
          </span>
          <span className="text-white/35 text-xs font-medium tracking-widest uppercase mb-1">
            FIFA World Cup 2026
          </span>
          <div className="flex items-center gap-1">
            <img src="https://flagcdn.com/w20/mx.png" alt="México"        width="18" className="rounded-sm opacity-60" />
            <img src="https://flagcdn.com/w20/us.png" alt="Estados Unidos" width="18" className="rounded-sm opacity-60" />
            <img src="https://flagcdn.com/w20/ca.png" alt="Canadá"         width="18" className="rounded-sm opacity-60" />
          </div>
        </NavLink>

        {/* Derecha: nav + usuario */}
        {user && (
          <div className="flex items-center justify-end gap-5">
            <NavLink to="/" end className={navLinkCls} style={navLinkStyle}>Partidos</NavLink>
            <NavLink to="/leaderboard" className={navLinkCls} style={navLinkStyle}>Tabla</NavLink>
            {user.is_admin && (
              <NavLink to="/admin"
                className={({ isActive }) => 'text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ' + (isActive ? 'text-teal-300' : 'text-teal-500/50 hover:text-teal-400')}
                style={({ isActive }) => isActive ? { background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' } : {}}
              >
                Admin
              </NavLink>
            )}
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid #1e1e1e' }}>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-white/60 font-semibold leading-none">{user.username}</p>
                {user.is_admin && (
                  <p className="text-[10px] text-teal-500 font-bold mt-0.5 uppercase tracking-widest">Admin</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-white/30 hover:text-white/70 px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: '1px solid #1e1e1e' }}
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
