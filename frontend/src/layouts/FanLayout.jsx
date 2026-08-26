import { NavLink, Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/fans', end: true, label: 'Dashboard' },
  { to: '/fans/roster', label: 'Roster / Coach' },
  { to: '/fans/transactions', label: 'Transactions' },
  { to: '/fans/standings', label: 'Standings' },
  { to: '/fans/playoffs', label: 'Playoffs' },
  { to: '/fans/awards', label: 'Awards' },
]

export default function FanLayout() {
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="side-nav-brand">
          <div className="logo">PBA</div>
          <div className="sub">Fan Zone</div>
        </div>
        <nav>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-nav-footer">
          <Link to="/" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Home / Login
          </Link>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
