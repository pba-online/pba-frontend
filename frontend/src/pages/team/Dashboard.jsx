import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'

export default function TeamDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard/team')
      .then((res) => setData(res.data?.data ?? res.data))
      .catch(() => setError('Unable to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Roster size', value: data?.roster_count ?? data?.roster ?? '—' },
    { label: 'Cap used', value: data?.cap_used ?? data?.salary_total ?? '—', alt: true },
    { label: 'Draft picks', value: data?.draft_picks_count ?? data?.draft_picks ?? '—' },
    { label: 'Record', value: data?.record ?? `${data?.wins ?? '—'}–${data?.losses ?? '—'}`, alt: true },
  ]

  return (
    <div>
      <PageHeader
        title="Team Dashboard"
        subtitle={`Front office overview${user?.name ? ` for ${user.name}` : ''}.`}
      />
      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="stat-grid">
          {stats.map((s) => (
            <div key={s.label} className={`stat-card${s.alt ? ' alt' : ''}`}>
              <div className="label">{s.label}</div>
              <div className="value">{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
