import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatMoney, unwrapList } from '../../utils/helpers'

export default function ContractsPage({ fixedTeamId = null, title = 'Contracts' }) {
  const [type, setType] = useState('player')
  const [teamId, setTeamId] = useState(fixedTeamId || '')
  const [teams, setTeams] = useState([])
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (fixedTeamId) return
    api
      .get('/teams')
      .then((res) => setTeams(unwrapList(res.data)))
      .catch(() => setTeams([]))
  }, [fixedTeamId])

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = { type }
    if (fixedTeamId) params.team_id = fixedTeamId
    else if (teamId) params.team_id = teamId

    api
      .get('/contracts', { params })
      .then((res) => setContracts(unwrapList(res.data)))
      .catch(() => {
        setError('Unable to load contracts')
        setContracts([])
      })
      .finally(() => setLoading(false))
  }, [type, teamId, fixedTeamId])

  const grouped = useMemo(() => {
    const map = new Map()
    contracts.forEach((c) => {
      const key = c.team_id || c.team?.id || 'unknown'
      const label = c.team?.name || c.team_name || `Team ${key}`
      if (!map.has(key)) map.set(key, { label, items: [] })
      map.get(key).items.push(c)
    })
    return Array.from(map.values())
  }, [contracts])

  function yearsFor(contract) {
    return (
      contract.years ||
      contract.contract_years ||
      contract.salaries ||
      []
    )
  }

  return (
    <div>
      <PageHeader title={title} subtitle="Year-by-year salaries grouped by team." />
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="toggle-group">
        <button type="button" className={type === 'player' ? 'active' : ''} onClick={() => setType('player')}>
          Players
        </button>
        <button type="button" className={type === 'coach' ? 'active' : ''} onClick={() => setType('coach')}>
          Coaches
        </button>
      </div>

      {!fixedTeamId ? (
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="contract-team">Team</label>
            <select
              id="contract-team"
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
        </div>
      ) : null}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="panel empty-state">No data</div>
      ) : (
        grouped.map((group) => (
          <div className="panel contract-group" key={group.label}>
            <h3>{group.label}</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Years</th>
                    <th>Yearly salaries</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((c) => {
                    const years = yearsFor(c)
                    const name =
                      c.player?.name ||
                      c.coach?.name ||
                      c.name ||
                      c.person_name ||
                      '—'
                    return (
                      <tr key={c.id}>
                        <td>{name}</td>
                        <td>{c.years_count || years.length || c.length || '—'}</td>
                        <td>
                          {years.length === 0
                            ? formatMoney(c.salary || c.annual_salary)
                            : years
                                .map((y) => {
                                  const yr = y.year || y.season || y.season_year || ''
                                  const sal = y.salary ?? y.amount
                                  return `${yr}: ${formatMoney(sal)}`
                                })
                                .join(' · ')}
                        </td>
                        <td>{formatMoney(c.total_salary || c.total || c.full_contract_salary)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
