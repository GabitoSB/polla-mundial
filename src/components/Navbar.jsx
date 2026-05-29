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
    <nav className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="text-2xl">⚽</span>
          <span>Polla Mundial</span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm hover:text-blue-200 transition-colors">
              Partidos
            </Link>
            <Link to="/leaderboard" className="text-sm hover:text-blue-200 transition-colors">
              Tabla
            </Link>
            {user.is_admin && (
              <Link to="/admin" className="text-sm hover:text-yellow-300 transition-colors font-medium">
                Admin
              </Link>
            )}
            <div className="flex items-center gap-3 border-l border-blue-500 pl-4">
              <span className="text-sm text-blue-200">
                {user.username}
                {user.is_admin && <span className="ml-1 text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-semibold">ADMIN</span>}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-blue-800 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors"
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
