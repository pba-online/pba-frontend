import { useEffect, useState } from 'react'
import api from '../api/client'
import { unwrapList } from '../utils/helpers'

export default function ConferenceFilter({ value, onChange, includeAll = true }) {
  const [conferences, setConferences] = useState([])

  useEffect(() => {
    api
      .get('/conferences')
      .then((res) => setConferences(unwrapList(res.data)))
      .catch(() => setConferences([]))
  }, [])

  return (
    <div className="filter-group">
      <label htmlFor="conference-filter">Conference</label>
      <select
        id="conference-filter"
        className="filter-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      >
        {includeAll ? <option value="">All conferences</option> : null}
        {conferences.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name || `Conference ${c.id}`}
          </option>
        ))}
      </select>
    </div>
  )
}
