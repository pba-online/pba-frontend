import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import PlayerCardModal from '../../components/PlayerCardModal'
import { formatMoney, getRatingValue, unwrapList } from '../../utils/helpers'

export default function TeamFreeAgent() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/free-agents/players')
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => setError('Unable to load free agents'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Free Agent" subtitle="Available unsigned players." />
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
                  <th>Player</th>
                  <th>Age</th>
                  <th>Overall</th>
                  <th>Position</th>
                  <th>Salary ask</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
                  return (
                    <tr key={p.id} className="clickable" onClick={() => setSelected(p)}>
                      <td>{name}</td>
                      <td>{p.age ?? '—'}</td>
                      <td>{getRatingValue(p, 'overall') || p.overall || '—'}</td>
                      <td>{p.position || '—'}</td>
                      <td>{formatMoney(p.asking_salary || p.last_salary || p.salary)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PlayerCardModal player={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
