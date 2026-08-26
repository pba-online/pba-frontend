import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { unwrapList } from '../../utils/helpers'

export default function FansDashboard() {
  const [data, setData] = useState(null)
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/fan').catch(() => ({ data: null })),
      api.get('/standings').catch(() => ({ data: [] })),
    ])
      .then(([dashRes, standRes]) => {
        setData(dashRes.data?.data ?? dashRes.data)
        setStandings(unwrapList(standRes.data).slice(0, 8))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Fan Dashboard" subtitle="League pulse — standings and highlights." />
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card">
              <div className="label">Teams</div>
              <div className="value">{data?.teams_count ?? data?.teams ?? '—'}</div>
            </div>
            <div className="stat-card alt">
              <div className="label">Games played</div>
              <div className="value">{data?.games_count ?? data?.games ?? '—'}</div>
            </div>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--blue-dark)' }}>
              Standings preview
            </h3>
            {standings.length === 0 ? (
              <div className="empty-state">No data</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th>W</th>
                      <th>L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((r, idx) => (
                      <tr key={r.id || idx}>
                        <td>{r.rank || idx + 1}</td>
                        <td>{r.team?.name || r.team_name || '—'}</td>
                        <td>{r.wins ?? '—'}</td>
                        <td>{r.losses ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
