import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import SeasonFilter from '../../components/SeasonFilter'
import PlayerCardModal from '../../components/PlayerCardModal'
import { useAuth } from '../../context/AuthContext'
import { formatMoney, getRatingValue, unwrapList } from '../../utils/helpers'

export default function TeamRoster() {
  const { user } = useAuth()
  const [seasonId, setSeasonId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = { team_id: user?.team_id }
    if (seasonId) params.season_id = seasonId
    api
      .get('/rosters', { params })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => {
        setError('Unable to load roster')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [seasonId, user?.team_id])

  return (
    <div>
      <PageHeader title="Roster" subtitle="Your current players — click a row for the 2K card." />
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
                  <th>Player</th>
                  <th>Age</th>
                  <th>Overall</th>
                  <th>This year</th>
                  <th>Full contract</th>
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
                      <td>
                        {formatMoney(
                          p.this_year_salary ?? p.current_salary ?? p.contract?.this_year_salary
                        )}
                      </td>
                      <td>
                        {formatMoney(
                          p.full_contract_salary ?? p.total_salary ?? p.contract?.total_salary
                        )}
                      </td>
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
