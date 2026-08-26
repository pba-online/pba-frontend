import { useEffect, useState } from 'react'
import api from '../api/client'
import { unwrapList } from '../utils/helpers'

export default function TeamFilter({ value, onChange, includeAll = true }) {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    api
      .get('/teams')
      .then((res) => setTeams(unwrapList(res.data)))
      .catch(() => setTeams([]))
  }, [])

  return (
    <div className="filter-group">
      <label htmlFor="team-filter">Team</label>
      <select
        id="team-filter"
        className="filter-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      >
        {includeAll ? <option value="">All teams</option> : null}
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  )
}