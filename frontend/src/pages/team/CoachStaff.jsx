import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import GradeBadge from '../../components/GradeBadge'
import { unwrapList } from '../../utils/helpers'

export default function TeamCoachStaff() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/team/coaches/staff')
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => setError('Unable to load coach/staff'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Coach / Staff" subtitle="Grades for offense, defense, development, and leadership." />
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
                  <th>Name</th>
                  <th>Role</th>
                  <th>Offense</th>
                  <th>Defense</th>
                  <th>Player Dev</th>
                  <th>Leadership</th>
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.role || c.position || '—'}</td>
                    <td>
                      <GradeBadge grade={c.offense_grade || c.offense} />
                    </td>
                    <td>
                      <GradeBadge grade={c.defense_grade || c.defense} />
                    </td>
                    <td>
                      <GradeBadge grade={c.player_development_grade || c.player_development} />
                    </td>
                    <td>
                      <GradeBadge grade={c.leadership_grade || c.leadership} />
                    </td>
                    <td>
                      <GradeBadge grade={c.overall_grade || c.overall} />
                    </td>
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
