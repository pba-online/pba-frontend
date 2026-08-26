import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard/admin')
      .then((res) => setData(res.data?.data ?? res.data))
      .catch(() => setError('Unable to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Teams', value: data?.teams_count ?? data?.teams ?? '—' },
    { label: 'Players', value: data?.players_count ?? data?.players ?? '—', alt: true },
    { label: 'Free agents', value: data?.free_agents_count ?? data?.free_agents ?? '—' },
    { label: 'Transactions', value: data?.transactions_count ?? data?.transactions ?? '—', alt: true },
  ]

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="League overview and operations snapshot." />
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
      {data?.message ? <p className="empty-state">{data.message}</p> : null}
    </div>
  )
}
