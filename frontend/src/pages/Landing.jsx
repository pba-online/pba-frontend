import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    if (user?.role === 'admin') navigate('/admin', { replace: true })
    else if (user?.role === 'team') navigate('/team', { replace: true })
  }, [isAuthenticated, user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedIn = await login(email, password)
      if (loggedIn.role === 'admin') navigate('/admin')
      else if (loggedIn.role === 'team') navigate('/team')
      else navigate('/fans')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  function scrollToLogin() {
    document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-brand">PBA</div>
          <p className="landing-tagline">
            Philippine Basketball Association — live standings, rosters, and league drama for every fan.
          </p>
          <div className="landing-cta">
            <Link to="/fans" className="btn btn-fan">
              Browse as fan
            </Link>
            <button type="button" className="btn btn-scroll" onClick={scrollToLogin}>
              Team / Admin login
            </button>
          </div>
        </div>
      </section>

      <section className="landing-login" id="login">
        <div className="landing-login-grid">
          <div>
            <h2>Front office access</h2>
            <p className="lead">
              Sign in to manage rosters, contracts, trades, and league operations. Fans can explore without an account.
            </p>
            <Link to="/fans" className="btn btn-primary">
              Continue as fan →
            </Link>
          </div>

          <form className="login-card" onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Login</h3>
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-danger" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="login-meta">Admin and team accounts only.</p>
          </form>
        </div>
      </section>
    </div>
  )
}
