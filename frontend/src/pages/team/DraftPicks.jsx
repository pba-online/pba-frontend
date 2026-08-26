import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { unwrapList } from '../../utils/helpers'

export default function TeamDraftPicks() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/draft-picks', { params: { team_id: user?.team_id } })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => setError('Unable to load draft picks'))
      .finally(() => setLoading(false))
  }, [user?.team_id])

  return (
    <div>
      <PageHeader title="Draft Picks" subtitle="Owned picks available for future drafts or trades." />
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
                  <th>Year</th>
                  <th>Round</th>
                  <th>Original team</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.year || '—'}</td>
                    <td>{p.round ?? '—'}</td>
                    <td>{p.original_team?.name || p.original_team_name || '—'}</td>
                    <td>{p.notes || p.label || '—'}</td>
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
