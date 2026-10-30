import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { unwrapList } from '../../utils/helpers'

const emptyPlayer = { first_name: '', last_name: '', position: '' }

export default function AdminDraft() {
  const [drafts, setDrafts] = useState([])
  const [selectedDraftId, setSelectedDraftId] = useState('')
  const [draft, setDraft] = useState(null)
  const [picks, setPicks] = useState([])
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [pickEdits, setPickEdits] = useState({})
  const [draftYear, setDraftYear] = useState(new Date().getFullYear())
  const [seasonId, setSeasonId] = useState('')
  const [draftName, setDraftName] = useState('')
  const [newPlayer, setNewPlayer] = useState(emptyPlayer)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPickId, setSavingPickId] = useState(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadSetup() {
      setLoading(true)
      setError('')
      try {
        const [draftsResponse, teamsResponse, seasonsResponse] = await Promise.all([
          api.get('/drafts/admin'),
          api.get('/teams'),
          api.get('/seasons'),
        ])
        const draftList = unwrapList(draftsResponse.data)
        const seasonList = unwrapList(seasonsResponse.data)
        setDrafts(draftList)
        setTeams(unwrapList(teamsResponse.data))
        setSeasonId((current) => current || seasonList.find((season) => season.is_current)?.id || seasonList[0]?.id || '')
        setSelectedDraftId((current) => current || draftList[0]?.id || '')
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load draft setup'))
      } finally {
        setLoading(false)
      }
    }
    loadSetup()
  }, [])

  useEffect(() => {
    if (!selectedDraftId) {
      setDraft(null)
      setPicks([])
      setPlayers([])
      return
    }

    let active = true
    async function loadDraft() {
      setLoading(true)
      setError('')
      try {
        const [draftResponse, playersResponse] = await Promise.all([
          api.get(`/drafts/${selectedDraftId}/details`),
          api.get(`/drafts/${selectedDraftId}/players`),
        ])
        if (!active) return
        setDraft(draftResponse.data.draft)
        setPicks(unwrapList(draftResponse.data.picks))
        setPlayers(unwrapList(playersResponse.data))
        setPickEdits({})
      } catch (err) {
        if (!active) return
        setError(getErrorMessage(err, 'Unable to load this draft'))
        setDraft(null)
        setPicks([])
      } finally {
        if (active) setLoading(false)
      }
    }
    loadDraft()
    return () => { active = false }
  }, [selectedDraftId])

  async function refreshDraftList(selectId = selectedDraftId) {
    const response = await api.get('/drafts/admin')
    const draftList = unwrapList(response.data)
    setDrafts(draftList)
    if (selectId) setSelectedDraftId(String(selectId))
  }

  async function createDraft(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post('/drafts', {
        draft_year: Number(draftYear),
        season_id: Number(seasonId),
        name: draftName.trim() || undefined,
      })
      await refreshDraftList(data.draft.id)
      setDraftName('')
      setSuccess(`Draft ${draftYear} created with 48 picks`)
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create draft'))
    } finally {
      setSaving(false)
    }
  }

  async function startDraft() {
    if (!draft) return
    setStarting(true)
    setError('')
    setSuccess('')
    try {
      await api.post(`/drafts/${draft.id}/start`)
      setSuccess('Draft started')
      await refreshDraftList(draft.id)
      const { data } = await api.get(`/drafts/${draft.id}/details`)
      setDraft(data.draft)
      setPicks(unwrapList(data.picks))
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to start draft'))
    } finally {
      setStarting(false)
    }
  }

  async function savePick(pick) {
    const edit = pickEdits[pick.id] || {
      current_team_id: pick.current_team_id,
      player_id: pick.player_id ?? '',
    }
    setSavingPickId(pick.id)
    setError('')
    setSuccess('')
    try {
      await api.put(`/drafts/${draft.id}/picks/${pick.id}`, {
        current_team_id: Number(edit.current_team_id),
        player_id: edit.player_id === '' ? null : Number(edit.player_id),
      })
      const [draftResponse, playersResponse] = await Promise.all([
        api.get(`/drafts/${draft.id}/details`),
        api.get(`/drafts/${draft.id}/players`),
      ])
      setDraft(draftResponse.data.draft)
      setPicks(unwrapList(draftResponse.data.picks))
      setPlayers(unwrapList(playersResponse.data))
      setPickEdits((current) => {
        const updated = { ...current }
        delete updated[pick.id]
        return updated
      })
      setSuccess(`Pick ${pick.pick} saved`)
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save pick'))
    } finally {
      setSavingPickId(null)
    }
  }

  async function addDraftPlayer(event) {
    event.preventDefault()
    if (!draft) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.post(`/drafts/${draft.id}/players`, newPlayer)
      const { data } = await api.get(`/drafts/${draft.id}/players`)
      setPlayers(unwrapList(data))
      setNewPlayer(emptyPlayer)
      setSuccess('Player added to the draft pool and Free Agents')
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to add player'))
    } finally {
      setSaving(false)
    }
  }

  function updatePickEdit(pick, field, value) {
    setPickEdits((current) => ({
      ...current,
      [pick.id]: {
        current_team_id: current[pick.id]?.current_team_id ?? pick.current_team_id,
        player_id: current[pick.id]?.player_id ?? pick.player_id ?? '',
        [field]: value,
      },
    }))
  }

  return (
    <div>
      <PageHeader title="Draft" subtitle="Set the draft order, manage selections, and review draft history." />
      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h3>Create Draft</h3>
        <form className="filters-row" onSubmit={createDraft}>
          <div className="form-field" style={{ minWidth: 130, marginBottom: 0 }}>
            <label htmlFor="draft-year">Draft year</label>
            <input id="draft-year" type="number" min="1900" max="2200" required value={draftYear} onChange={(event) => setDraftYear(event.target.value)} />
          </div>
          <div className="form-field" style={{ minWidth: 190, marginBottom: 0 }}>
            <label htmlFor="draft-name">Draft name</label>
            <input id="draft-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder={`Draft ${draftYear}`} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving || loading || teams.length !== 24 || !seasonId}>
            {saving ? 'Creating…' : 'Create 48-pick draft'}
          </button>
          {!seasonId && !loading ? <span className="filter-error">Create a season before setting up a draft.</span> : null}
          {teams.length !== 24 ? <span className="filter-error">This format needs 24 teams; found {teams.length}.</span> : null}
        </form>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="draft-history">Draft history</label>
          <select
            id="draft-history"
            className="filter-select"
            value={selectedDraftId}
            onChange={(event) => setSelectedDraftId(event.target.value)}
          >
            <option value="">Select a draft</option>
            {drafts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || `Draft ${item.draft_year}`} · {item.status} · {item.picks_count}/48 picks
              </option>
            ))}
          </select>
        </div>
        {draft ? (
          <div style={{ display: 'flex', alignItems: 'end', gap: '0.75rem' }}>
            <span className="status-badge">{draft.status}</span>
            {draft.status === 'setup' ? (
              <button type="button" className="btn btn-primary" onClick={startDraft} disabled={starting || savingPickId !== null}>
                {starting ? 'Starting…' : 'Start Draft'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {draft ? (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <h3>Add a player to the draft pool</h3>
          <form className="filters-row" onSubmit={addDraftPlayer}>
            <div className="form-field" style={{ minWidth: 150, marginBottom: 0 }}>
              <label htmlFor="draft-player-first">First name</label>
              <input id="draft-player-first" required value={newPlayer.first_name} onChange={(event) => setNewPlayer({ ...newPlayer, first_name: event.target.value })} />
            </div>
            <div className="form-field" style={{ minWidth: 150, marginBottom: 0 }}>
              <label htmlFor="draft-player-last">Last name</label>
              <input id="draft-player-last" required value={newPlayer.last_name} onChange={(event) => setNewPlayer({ ...newPlayer, last_name: event.target.value })} />
            </div>
            <div className="form-field" style={{ minWidth: 130, marginBottom: 0 }}>
              <label htmlFor="draft-player-position">Position</label>
              <input id="draft-player-position" value={newPlayer.position} onChange={(event) => setNewPlayer({ ...newPlayer, position: event.target.value })} placeholder="PG/SG" />
            </div>
            <button className="btn btn-secondary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add player'}</button>
          </form>
        </div>
      ) : null}

      <div className="panel">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : !draft ? (
          <div className="empty-state">Create or select a draft to manage picks.</div>
        ) : picks.length === 0 ? (
          <div className="empty-state">This draft has no picks.</div>
        ) : (
          [1, 2].map((round) => (
            <section key={round} style={{ marginBottom: '1.25rem' }}>
              <h3>Round {round}</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Pick</th><th>Team</th><th>Player</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {picks.filter((pick) => pick.round === round).map((pick) => {
                      const edit = pickEdits[pick.id] || { current_team_id: pick.current_team_id, player_id: pick.player_id ?? '' }
                      return (
                        <tr key={pick.id}>
                          <td>{pick.pick}</td>
                          <td>
                            <select aria-label={`Team for round ${round} pick ${pick.pick}`} value={edit.current_team_id} onChange={(event) => updatePickEdit(pick, 'current_team_id', event.target.value)} disabled={draft.status === 'completed'}>
                              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                            </select>
                          </td>
                          <td>
                            <select aria-label={`Player for round ${round} pick ${pick.pick}`} value={edit.player_id} onChange={(event) => updatePickEdit(pick, 'player_id', event.target.value)} disabled={draft.status !== 'active'}>
                              <option value="">Undrafted</option>
                              {players.map((player) => <option key={player.id} value={player.id}>{player.name}{player.position ? ` · ${player.position}` : ''}</option>)}
                            </select>
                          </td>
                          <td>{pick.status}</td>
                          <td>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => savePick(pick)} disabled={savingPickId === pick.id || draft.status === 'completed'}>
                              {savingPickId === pick.id ? 'Saving…' : 'Save pick'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function getErrorMessage(error, fallback) {
  const validationMessages = Object.values(error.response?.data?.errors || {}).flat()
  return validationMessages[0] || error.response?.data?.message || fallback
}
