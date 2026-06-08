import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkCls = ({ isActive }) =>
  'text-base font-semibold px-3 py-2 rounded-lg transition-all block w-full md:w-auto ' +
  (isActive ? 'text-white' : 'text-on-dark-muted hover:text-on-dark')

const navLinkStyle = ({ isActive }) =>
  isActive ? { background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(59,130,246,0.35)' } : {}

const adminLinkCls = ({ isActive }) =>
  'text-base font-semibold px-3 py-2 rounded-lg transition-all block w-full md:w-auto ' +
  (isActive ? 'text-teal-300' : 'text-teal-400/80 hover:text-teal-300')

const adminLinkStyle = ({ isActive }) =>
  isActive ? { background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' } : {}

function BrandLink({ onClick, compact = false }) {
  return (
    <NavLink
      to="/"
      className="flex flex-col items-center leading-tight group"
      end
      onClick={onClick}
    >
      <span className={`text-white font-black tracking-wide group-hover:text-white/80 transition-colors ${compact ? 'text-lg' : 'text-xl'}`}>
        Pulpo Paul
      </span>
      {!compact && (
        <>
          <span className="text-on-dark-muted text-sm font-medium tracking-widest uppercase mb-1">
            FIFA World Cup 2026
          </span>
          <div className="flex items-center gap-1">
            <img src="https://flagcdn.com/w20/mx.png" alt="México" width="18" className="rounded-sm opacity-60" />
            <img src="https://flagcdn.com/w20/us.png" alt="Estados Unidos" width="18" className="rounded-sm opacity-60" />
            <img src="https://flagcdn.com/w20/ca.png" alt="Canadá" width="18" className="rounded-sm opacity-60" />
          </div>
        </>
      )}
    </NavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  const closeMenu = () => setOpen(false)

  if (!user) return null

  const navItems = (
    <>
      <NavLink to="/" end className={navLinkCls} style={navLinkStyle} onClick={closeMenu}>
        Partidos
      </NavLink>
      <NavLink to="/leaderboard" className={navLinkCls} style={navLinkStyle} onClick={closeMenu}>
        Tabla
      </NavLink>
      {user.is_admin && (
        <NavLink to="/admin" className={adminLinkCls} style={adminLinkStyle} onClick={closeMenu}>
          Administración
        </NavLink>
      )}
    </>
  )

  return (
    <nav style={{ background: '#000000', borderBottom: '1px solid #1a1a1a' }}>
      {/* ── Móvil ── */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <BrandLink onClick={closeMenu} compact />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-white/70 hover:text-white p-2 rounded-lg transition-colors"
            style={{ border: '1px solid #2a2a2a' }}
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {open && (
          <div className="px-4 pb-4 space-y-1 border-t border-white/5 pt-3">
            {navItems}
            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <p className={`text-sm font-semibold truncate ${user.is_admin ? 'text-teal-400' : 'text-on-dark-muted'}`}>
                {user.username}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-on-dark-muted hover:text-on-dark px-3 py-2 rounded-lg transition-colors shrink-0"
                style={{ border: '1px solid #1e1e1e' }}
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Escritorio (sin cambios visuales) ── */}
      <div className="hidden md:block max-w-6xl mx-auto px-5 py-4">
        <div className="grid grid-cols-3 items-center">
          <div />
          <BrandLink />
          <div className="flex items-center justify-end gap-5">
            <NavLink to="/" end className={navLinkCls} style={navLinkStyle}>Partidos</NavLink>
            <NavLink to="/leaderboard" className={navLinkCls} style={navLinkStyle}>Tabla</NavLink>
            {user.is_admin && (
              <NavLink to="/admin" className={adminLinkCls} style={adminLinkStyle}>
                Administración
              </NavLink>
            )}
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid #1e1e1e' }}>
              <div className="text-right">
                <p className={`text-sm font-semibold leading-none ${user.is_admin ? 'text-teal-400' : 'text-on-dark-muted'}`}>
                  {user.username}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-on-dark-muted hover:text-on-dark px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: '1px solid #1e1e1e' }}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
