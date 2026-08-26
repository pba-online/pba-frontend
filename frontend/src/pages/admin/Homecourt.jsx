import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { unwrapList } from '../../utils/helpers'

function groupByDivision(teams) {
  const groups = {}
  for (const t of teams) {
    const key = t.division_name || 'No division'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  const order = ['North', 'South']
  return Object.entries(groups).sort(([a], [b]) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export default function AdminHomecourt() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/homecourt')
      .then((res) => setTeams(unwrapList(res.data)))
      .catch(() => setError('Unable to load homecourt data'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Homecourt" subtitle="Arenas, venues, and team ownership." />
      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : teams.length === 0 ? (
        <div className="panel">
          <div className="empty-state">No data</div>
        </div>
      ) : (
        groupByDivision(teams).map(([divisionName, divisionTeams]) => (
          <div key={divisionName} style={{ marginBottom: '2rem' }}>
            <h4
              style={{
                fontSize: '1.15rem',
                margin: '0 0 0.75rem',
                color: 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-dark)',
                paddingBottom: '0.4rem',
              }}
            >
              {divisionName} Division
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1rem',
              }}
            >
              {divisionTeams.map((t) => (
                <div
                  key={t.id}
                  className="panel"
                  style={{ margin: 0, padding: '1.1rem 1.25rem' }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      margin: '0 0 0.75rem',
                      color: 'var(--blue-dark)',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    {t.team_name}
                  </h3>

                  <dl style={{ margin: 0, display: 'grid', rowGap: '0.4rem' }}>
                    <Row label="Homecourt" value={t.homecourt} />
                    <Row label="Capacity" value={t.capacity != null ? Number(t.capacity).toLocaleString() : null} />
                    <Row label="City" value={t.city} />
                    <Row label="Team Owner" value={t.owner_name} />
                    <Row label="Company" value={t.company} />
                  </dl>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.9rem' }}>
      <dt style={{ color: '#64748b' }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 500, textAlign: 'right' }}>{value || '—'}</dd>
    </div>
  )
}