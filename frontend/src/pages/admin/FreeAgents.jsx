import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import PlayerCardModal from '../../components/PlayerCardModal'
import SeasonFilter from '../../components/SeasonFilter'
import { formatMoney, getRatingValue, unwrapList } from '../../utils/helpers'

const emptyForm = {
  first_name: '',
  last_name: '',
  age: '',
  height: '',
  weight_lbs: '',
  position: '',
}

function formatHeight(inches) {
  if (inches === null || inches === undefined || inches === '') return ''
  return `${Math.floor(inches / 12)}'${inches % 12}`
}

export default function AdminFreeAgents() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [seasonId, setSeasonId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    try {
      const res = await api.get('/free-agents/players')
      setRows(unwrapList(res.data))
      setError('')
    } catch {
      setError('Unable to load free agents')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api
      .get('/free-agents/players')
      .then((res) => {
        if (active) setRows(unwrapList(res.data))
      })
      .catch(() => {
        if (active) {
          setError('Unable to load free agents')
          setRows([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function startEditing(player) {
    setEditingId(player.id)
    setForm({
      first_name: player.first_name || '',
      last_name: player.last_name || '',
      age: player.age ?? '',
      height: player.height || formatHeight(player.height_inches),
      weight_lbs: player.weight_lbs ?? player.weight ?? '',
      position: player.position || '',
    })
    setSuccess('')
  }

  function cancelEditing() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const height = form.height.trim()
    const heightMatch = height.match(/^(\d{1,2})['\u2019](\d{1,2})"?$/)
    const heightInches = height ? Number(heightMatch?.[1]) * 12 + Number(heightMatch?.[2]) : null
    if (height && (!heightMatch || Number(heightMatch[2]) >= 12 || heightInches < 48 || heightInches > 96)) {
      setError("Enter height as feet'inches, for example 6'7")
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === '' ? null : value])
    )
    delete payload.height
    payload.height_inches = heightInches
    try {
      if (editingId) {
        await api.put(`/free-agents/players/${editingId}`, payload)
        setSuccess('Player updated')
      } else {
        await api.post('/free-agents/players', payload)
        setSuccess('Free agent added')
      }
      cancelEditing()
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save player')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Free Agents" subtitle="Players currently without a team." />
      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}
      <div className="filters-row">
        <SeasonFilter value={seasonId} onChange={setSeasonId} />
      </div>
      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--blue-dark)' }}>
          {editingId ? 'Edit player' : 'Add free agent'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="filters-row">
            {[
              ['first_name', 'First name'],
              ['last_name', 'Last name'],
              ['age', 'Age'],
              ['height', 'Height'],
              ['weight_lbs', 'Weight (lb)'],
              ['position', 'Position'],
            ].map(([key, label]) => (
              <div className="form-field" key={key} style={{ flex: key.includes('name') ? 1 : undefined, minWidth: key.includes('name') ? 150 : 100, marginBottom: 0 }}>
                <label htmlFor={`free-agent-${key}`}>{label}</label>
                <input
                  id={`free-agent-${key}`}
                  type={['age', 'weight_lbs'].includes(key) ? 'number' : 'text'}
                  min={key === 'age' ? 0 : key === 'weight_lbs' ? 100 : undefined}
                  max={key === 'age' ? 99 : key === 'weight_lbs' ? 500 : undefined}
                  value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  required={key === 'first_name' || key === 'last_name'}
                />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save' : 'Add'}
            </button>
            {editingId ? (
              <button type="button" className="btn btn-ghost" onClick={cancelEditing} disabled={saving}>
                Cancel
              </button>
            ) : null}
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
                  <th>Player</th>
                  <th>Age</th>
                  <th>Overall</th>
                  <th>Position</th>
                  <th>Last salary</th>
                  <th>Actions</th>
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
                      <td>{p.position || '—'}</td>
                      <td>{formatMoney(p.last_salary || p.this_year_salary || p.salary)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            startEditing(p)
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PlayerCardModal key={`${selected?.id || 'none'}-${seasonId || 'none'}`} player={selected} seasonId={seasonId} editable onClose={() => setSelected(null)} onSaved={load} />
    </div>
  )
}
