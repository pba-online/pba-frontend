import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import SeasonFilter from '../../components/SeasonFilter'
import { unwrapList } from '../../utils/helpers'

export default function AwardsPage({ title = 'Awards' }) {
  const [seasonId, setSeasonId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (seasonId) params.season_id = seasonId
    api
      .get('/awards', { params })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => {
        setError('Unable to load awards')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [seasonId])

  return (
    <div>
      <PageHeader title={title} subtitle="Season awards and honorees." />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="filters-row">
        <SeasonFilter value={seasonId} onChange={setSeasonId} />
      </div>
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
                  <th>Award</th>
                  <th>Winner</th>
                  <th>Team</th>
                  <th>Season</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name || a.award_name || a.title || '—'}</td>
                    <td>{a.winner?.name || a.player?.name || a.recipient_name || a.winner_name || '—'}</td>
                    <td>{a.team?.name || a.team_name || '—'}</td>
                    <td>{a.season?.name || a.season_name || a.year || '—'}</td>
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
