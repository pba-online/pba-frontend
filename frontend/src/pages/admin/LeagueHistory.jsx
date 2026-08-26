import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { unwrapList } from '../../utils/helpers'

export default function AdminLeagueHistory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/league-history')
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => setError('Unable to load league history'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader
        title="League History"
        subtitle="Conference champions and Finals MVP for every season."
      />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="panel">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No data</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Conference</th>
                  <th>Champion</th>
                  <th>Finals MVP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id || `${r.season_id}-${r.conference_id}`}>
                    <td>{r.season?.name || r.season_name || r.year || '—'}</td>
                    <td>{r.conference?.name || r.conference_name || '—'}</td>
                    <td>{r.champion?.name || r.champion_name || r.team?.name || '—'}</td>
                    <td>{r.finals_mvp?.name || r.finals_mvp_name || r.mvp || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
