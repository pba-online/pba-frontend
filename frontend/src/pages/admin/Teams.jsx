import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { unwrapList } from '../../utils/helpers'

const emptyForm = { name: '', abbreviation: '', city: '', division_id: '' }

function groupByDivision(teams) {
  const groups = {}
  for (const t of teams) {
    const key = t.division_name || t.division?.name || 'No division'
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

export default function AdminTeams() {
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const teamsRes = await api.get('/teams')
      setTeams(unwrapList(teamsRes.data))
    } catch {
      setError('Unable to load teams')
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/teams', {
        ...form,
        division_id: form.division_id ? Number(form.division_id) : null,
      })
      setForm(emptyForm)
      setSuccess('Team added')
      setShowAddModal(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add team')
    } finally {
      setSaving(false)
    }
  }

  function openAddModal() {
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <PageHeader title="Teams" subtitle="Add and review league franchises." />
        <button type="button" className="btn btn-primary" onClick={openAddModal} style={{ marginTop: '0.25rem' }}>
          + Add Team
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="panel">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : teams.length === 0 ? (
          <div className="empty-state">No data</div>
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {divisionTeams.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1rem',
                      background: '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {t.abbreviation || t.abbr || '—'}
                      {t.city ? ` · ${t.city}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeAddModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="panel"
            style={{ width: '100%', maxWidth: 480, margin: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--blue-dark)', margin: 0 }}>Add Team</h3>
              <button
                type="button"
                onClick={closeAddModal}
                aria-label="Close"
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {error ? <div className="error-banner">{error}</div> : null}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="team-name">Name</label>
                <input
                  id="team-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="team-abbr">Abbr</label>
                <input
                  id="team-abbr"
                  value={form.abbreviation}
                  onChange={(e) => setForm({ ...form, abbreviation: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="team-city">City</label>
                <input
                  id="team-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="team-division">Division</label>
                <select
                  id="team-division"
                  value={form.division_id}
                  onChange={(e) => setForm({ ...form, division_id: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="1">North</option>
                  <option value="2">South</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Add team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}