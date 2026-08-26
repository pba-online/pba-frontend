import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINKS = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/teams', label: 'Teams' },
  { to: '/admin/roster', label: 'Roster' },
  { to: '/admin/homecourt', label: 'Homecourt' },
   { to: '/admin/seasons', label: 'Seasons' },
  { to: '/admin/contracts', label: 'Contracts' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/standings', label: 'Standings' },
  { to: '/admin/playoffs', label: 'Playoffs' },
  { to: '/admin/awards', label: 'Awards' },
  { to: '/admin/league-history', label: 'League History' },
  { to: '/admin/draft', label: 'Draft' },
  { to: '/admin/free-agents', label: 'Free Agents' },
  { to: '/admin/free-agents-coach', label: 'FA Coach/Staff' },
]

export default function AdminLayout() {
  const { user, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role !== 'admin') {
    if (user?.role === 'team') return <Navigate to="/team" replace />
    return <Navigate to="/" replace />
  }

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="side-nav-brand">
          <div className="logo">PBA</div>
          <div className="sub">Admin Control</div>
        </div>
        <div className="side-nav-user">{user?.name || 'Admin'}</div>
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
