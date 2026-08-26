import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { unwrapList } from '../../utils/helpers'

export default function TeamSchedule() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/games', { params: { team_id: user?.team_id } })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => setError('Unable to load schedule'))
      .finally(() => setLoading(false))
  }, [user?.team_id])

  return (
    <div>
      <PageHeader title="Schedule" subtitle="Upcoming and completed games." />
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
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Venue</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => {
                  const home = g.home_team?.name || g.home_team_name
                  const away = g.away_team?.name || g.away_team_name
                  const isHome = g.home_team_id === user?.team_id
                  const opponent = isHome ? away : home
                  return (
                    <tr key={g.id}>
                      <td>{g.date || g.game_date || '—'}</td>
                      <td>
                        {isHome ? 'vs' : '@'} {opponent || '—'}
                      </td>
                      <td>{g.venue?.name || g.venue_name || '—'}</td>
                      <td>
                        {g.result ||
                          (g.home_score != null
                            ? `${g.home_score}–${g.away_score}`
                            : g.status || 'Scheduled')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
