import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import SeasonFilter from '../../components/SeasonFilter'
import PlayerCardModal from '../../components/PlayerCardModal'
import GradeBadge from '../../components/GradeBadge'
import { formatMoney, getRatingValue, unwrapList } from '../../utils/helpers'

export default function TeamRoster() {
  const [mode, setMode] = useState('players')
  const [seasonId, setSeasonId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (mode === 'players' && seasonId) params.season_id = seasonId
    api
      .get(mode === 'players' ? '/team/rosters' : '/team/coaches/staff', { params })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => {
        setError('Unable to load roster')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [mode, seasonId])

  return (
    <div>
      <PageHeader title="Roster" subtitle="Your current players — click a row for the 2K card." />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="toggle-group">
        <button type="button" className={mode === 'players' ? 'active' : ''} onClick={() => setMode('players')}>
          Players
        </button>
        <button type="button" className={mode === 'coaches' ? 'active' : ''} onClick={() => setMode('coaches')}>
          Coaches
        </button>
      </div>
      {mode === 'players' ? <div className="filters-row"><SeasonFilter value={seasonId} onChange={setSeasonId} /></div> : null}
      <div className="panel">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No data</div>
        ) : mode === 'players' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Age</th>
                  <th>Height</th>
                  <th>Position</th>
                  <th>Overall</th>
                  <th>This Year Contract</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
                  return (
                    <tr key={p.id} className="clickable" onClick={() => setSelected(p)}>
                      <td>{name}</td>
                      <td>{p.age ?? '—'}</td>
                      <td>{p.height || '—'}</td>
                      <td>{p.position || '—'}</td>
                      <td>{getRatingValue(p, 'overall') || p.overall || '—'}</td>
                      <td>
                        {formatMoney(
                          p.this_year_salary ?? p.current_salary ?? p.contract?.this_year_salary
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
                {rows.map((coach) => (
                  <tr key={coach.id}>
                    <td>{coach.name || '—'}</td>
                    <td>{coach.role || '—'}</td>
                    <td><GradeBadge grade={coach.offense_grade} /></td>
                    <td><GradeBadge grade={coach.defense_grade} /></td>
                    <td><GradeBadge grade={coach.player_development_grade} /></td>
                    <td><GradeBadge grade={coach.leadership_grade} /></td>
                    <td><GradeBadge grade={coach.overall_grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PlayerCardModal player={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
