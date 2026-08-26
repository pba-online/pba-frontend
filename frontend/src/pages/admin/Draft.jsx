import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { unwrapList } from '../../utils/helpers'

export default function AdminDraft() {
  const [year, setYear] = useState('')
  const [years, setYears] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/seasons')
      .then((res) => {
        const seasons = unwrapList(res.data)
        setYears(seasons.map((s) => s.year || s.name).filter(Boolean))
      })
      .catch(() => setYears([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (year) params.year = year
    api
      .get('/drafts', { params })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => {
        setError('Unable to load draft')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div>
      <PageHeader title="Draft" subtitle="Draft results by year." />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="draft-year">Year</label>
          <select
            id="draft-year"
            className="filter-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
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
                  <th>Year</th>
                  <th>Round</th>
                  <th>Pick</th>
                  <th>Team</th>
                  <th>Player</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td>{d.year || d.draft_year || '—'}</td>
                    <td>{d.round ?? '—'}</td>
                    <td>{d.pick ?? d.overall_pick ?? '—'}</td>
                    <td>{d.team?.name || d.team_name || '—'}</td>
                    <td>{d.player?.name || d.player_name || d.name || '—'}</td>
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
