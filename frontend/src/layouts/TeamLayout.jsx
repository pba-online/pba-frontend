import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINKS = [
  { to: '/team', end: true, label: 'Dashboard' },
  { to: '/team/roster', label: 'Roster' },
  { to: '/team/coach-staff', label: 'Coach/Staff' },
  { to: '/team/contracts', label: 'Contracts' },
  { to: '/team/trade', label: 'Trade' },
  { to: '/team/free-agent', label: 'Free Agent' },
  { to: '/team/coach-free-agent', label: 'Coach/Staff FA' },
  { to: '/team/transactions', label: 'Transactions' },
  { to: '/team/schedule', label: 'Schedule' },
  { to: '/team/standings', label: 'Standings' },
  { to: '/team/draft-picks', label: 'Draft Picks' },
  { to: '/team/awards', label: 'Awards' },
]

export default function TeamLayout() {
  const { user, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role !== 'team') {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="side-nav-brand">
          <div className="logo">PBA</div>
          <div className="sub">Team Front Office</div>
        </div>
        <div className="side-nav-user">{user?.name || 'Team'}</div>
        <nav>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-nav-footer">
          <button type="button" className="btn btn-danger" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
