import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import GradeBadge from '../../components/GradeBadge'
import { unwrapList } from '../../utils/helpers'

const emptyForm = {
  name: '',
  role: '',
  offense_grade: 'B',
  defense_grade: 'B',
  player_development_grade: 'B',
  leadership_grade: 'B',
  overall_grade: 'B',
}

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-']

export default function AdminFreeAgentsCoach() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/free-agents/coaches')
      setRows(unwrapList(res.data))
    } catch {
      setError('Unable to load coach free agents')
      setRows([])
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
      await api.post('/free-agents/coaches', form)
      setForm(emptyForm)
      setSuccess('Coach/staff free agent added')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add free agent')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="FA Coach / Staff" subtitle="Unsigned coaches and staff available to sign." />
      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--blue-dark)' }}>Add free agent</h3>
        <form onSubmit={handleSubmit}>
          <div className="filters-row">
            <div className="form-field" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-field" style={{ minWidth: 140, marginBottom: 0 }}>
              <label>Role</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Head Coach"
              />
            </div>
            {[
              ['offense_grade', 'Offense'],
              ['defense_grade', 'Defense'],
              ['player_development_grade', 'Dev'],
              ['leadership_grade', 'Lead'],
              ['overall_grade', 'Overall'],
            ].map(([key, label]) => (
              <div className="form-field" key={key} style={{ width: 100, marginBottom: 0 }}>
                <label>{label}</label>
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </form>
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
                  <th>Name</th>
                  <th>Role</th>
                  <th>Offense</th>
                  <th>Defense</th>
                  <th>Dev</th>
                  <th>Leadership</th>
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.role || '—'}</td>
                    <td>
                      <GradeBadge grade={c.offense_grade || c.offense} />
                    </td>
                    <td>
                      <GradeBadge grade={c.defense_grade || c.defense} />
                    </td>
                    <td>
                      <GradeBadge grade={c.player_development_grade || c.player_development} />
                    </td>
                    <td>
                      <GradeBadge grade={c.leadership_grade || c.leadership} />
                    </td>
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
    </div>
  )
}
