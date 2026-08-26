import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import SeasonFilter from '../../components/SeasonFilter'
import { unwrapList } from '../../utils/helpers'

export default function PlayoffsPage({ title = 'Playoffs' }) {
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
      .get('/playoffs', { params })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => {
        setError('Unable to load playoffs')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [seasonId])

  return (
    <div>
      <PageHeader title={title} subtitle="Bracket results by season." />
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
                  <th>Round</th>
                  <th>Conference</th>
                  <th>Matchup</th>
                  <th>Result</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.round || p.round_name || '—'}</td>
                    <td>{p.conference?.name || p.conference_name || '—'}</td>
                    <td>
                      {p.team1?.name || p.home_team?.name || p.team_a || '—'} vs{' '}
                      {p.team2?.name || p.away_team?.name || p.team_b || '—'}
                    </td>
                    <td>
                      {p.result ||
                        p.score ||
                        (p.wins_team1 != null ? `${p.wins_team1}–${p.wins_team2}` : '—')}
                    </td>
                    <td>{p.winner?.name || p.winner_name || '—'}</td>
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
