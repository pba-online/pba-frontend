import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { unwrapList } from '../../utils/helpers'

const emptyForm = { season_year: '', conference_id: '', is_current: false }

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState([])
  const [conferences, setConferences] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingSeasonId, setUpdatingSeasonId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [seasonsRes, confRes] = await Promise.all([
        api.get('/seasons'),
        api.get('/conferences'),
      ])
      setSeasons(unwrapList(seasonsRes.data))
      setConferences(unwrapList(confRes.data))
    } catch {
      setError('Unable to load seasons')
      setSeasons([])
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
      const conference = conferences.find((item) => item.id === Number(form.conference_id))
      await api.post('/seasons', {
        ...form,
        conference_id: form.conference_id ? Number(form.conference_id) : null,
        conference_season: `${conference?.name || ''} ${form.season_year}`.trim(),
      })
      setForm(emptyForm)
      setSuccess('Season added')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add season')
    } finally {
      setSaving(false)
    }
  }

  async function handleCurrentChange(season, isCurrent) {
    setUpdatingSeasonId(season.id)
    setError('')
    setSuccess('')
    try {
      await api.put(`/seasons/${season.id}/current`, { is_current: isCurrent })
      setSeasons((current) => current.map((item) => ({
        ...item,
        is_current: isCurrent ? item.id === season.id : item.id === season.id ? false : item.is_current,
      })))
      setSuccess(isCurrent ? 'Current season updated' : 'Current season cleared')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update current season')
    } finally {
      setUpdatingSeasonId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Seasons" subtitle="Manage league seasons and conference type." />
      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--blue-dark)' }}>Add Season</h3>
        <form onSubmit={handleSubmit}>
          <div className="filters-row">
            <div className="form-field" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
              <label htmlFor="season-year">Season Year</label>
              <input
                id="season-year"
                placeholder="e.g. 2024-2025"
                value={form.season_year}
                onChange={(e) => setForm({ ...form, season_year: e.target.value })}
                required
              />
            </div>
            <div className="form-field" style={{ minWidth: 200, marginBottom: 0 }}>
              <label htmlFor="conference-type">Conference</label>
              <select
                id="conference-type"
                value={form.conference_id}
                onChange={(e) => setForm({ ...form, conference_id: e.target.value })}
                required
              >
                <option value="">Select</option>
                {conferences.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                id="is-current"
                type="checkbox"
                checked={form.is_current}
                onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
              />
              <label htmlFor="is-current" style={{ marginBottom: 0 }}>Current season</label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add season'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : seasons.length === 0 ? (
          <div className="empty-state">No data</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Conference season</th>
                  <th>Season year</th>
                  <th>Conference</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={s.id}>
                    <td>{s.conference_season}</td>
                    <td>{s.season_year}</td>
                    <td>{conferences.find((conference) => conference.id === s.conference_id)?.name || '—'}</td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Set ${s.conference_season || s.season_year} as current season`}
                        checked={Boolean(s.is_current)}
                        disabled={updatingSeasonId !== null}
                        onChange={(event) => handleCurrentChange(s, event.target.checked)}
                      />
                    </td>
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