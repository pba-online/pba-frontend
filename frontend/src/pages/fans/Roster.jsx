import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import SeasonFilter from '../../components/SeasonFilter'
import PlayerCardModal from '../../components/PlayerCardModal'
import GradeBadge from '../../components/GradeBadge'
import { formatMoney, getRatingValue, unwrapList } from '../../utils/helpers'

export default function FansRoster() {
  const [mode, setMode] = useState('players')
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/teams')
      .then((res) => setTeams(unwrapList(res.data)))
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (mode === 'players') {
          const params = {}
          if (teamId) params.team_id = teamId
          if (seasonId) params.season_id = seasonId
          const res = await api.get('/rosters', { params })
          setRows(unwrapList(res.data))
        } else {
          const params = {}
          if (teamId) params.team_id = teamId
          const res = await api.get('/coaches/staff', { params })
          setRows(unwrapList(res.data))
        }
      } catch {
        setError('Unable to load roster')
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [mode, teamId, seasonId])

  return (
    <div>
      <PageHeader title="Roster / Coach" subtitle="Browse team players and coaching staff." />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="toggle-group">
        <button type="button" className={mode === 'players' ? 'active' : ''} onClick={() => setMode('players')}>
          Players
        </button>
        <button type="button" className={mode === 'coaches' ? 'active' : ''} onClick={() => setMode('coaches')}>
          Coaches
        </button>
      </div>
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="fan-team">Team</label>
          <select
            id="fan-team"
            className="filter-select"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {mode === 'players' ? <SeasonFilter value={seasonId} onChange={setSeasonId} /> : null}
      </div>
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
                  <th>Team</th>
                  <th>Age</th>
                  <th>Overall</th>
                  <th>Salary</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
                  return (
                    <tr key={p.id} className="clickable" onClick={() => setSelected(p)}>
                      <td>{name}</td>
                      <td>{p.team?.name || p.team_name || '—'}</td>
                      <td>{p.age ?? '—'}</td>
                      <td>{getRatingValue(p, 'overall') || p.overall || '—'}</td>
                      <td>{formatMoney(p.this_year_salary ?? p.current_salary)}</td>
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
                  <th>Team</th>
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.role || '—'}</td>
                    <td>{c.team?.name || c.team_name || '—'}</td>
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
      <PlayerCardModal player={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
