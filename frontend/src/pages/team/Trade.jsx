import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { unwrapList } from '../../utils/helpers'

export default function TeamTrade() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [selectedTeams, setSelectedTeams] = useState([])
  const [rosters, setRosters] = useState({})
  const [picks, setPicks] = useState({})
  const [allocations, setAllocations] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api
      .get('/teams')
      .then((res) => {
        const list = unwrapList(res.data)
        setTeams(list)
        if (user?.team_id) {
          setSelectedTeams([Number(user.team_id)])
        }
      })
      .catch(() => setTeams([]))
  }, [user?.team_id])

  useEffect(() => {
    if (selectedTeams.length < 2) {
      setRosters({})
      setPicks({})
      return
    }
    let cancelled = false
    async function loadAssets() {
      setLoading(true)
      setError('')
      try {
        const nextRosters = {}
        const nextPicks = {}
        await Promise.all(
          selectedTeams.map(async (id) => {
            const [rosterRes, picksRes] = await Promise.all([
              api.get('/rosters', { params: { team_id: id } }),
              api.get('/draft-picks', { params: { team_id: id } }),
            ])
            nextRosters[id] = unwrapList(rosterRes.data)
            nextPicks[id] = unwrapList(picksRes.data)
          })
        )
        if (!cancelled) {
          setRosters(nextRosters)
          setPicks(nextPicks)
          setAllocations((prev) => {
            const next = { ...prev }
            selectedTeams.forEach((id) => {
              if (!next[id]) next[id] = { players: [], draft_picks: [] }
            })
            Object.keys(next).forEach((key) => {
              if (!selectedTeams.includes(Number(key))) delete next[key]
            })
            return next
          })
        }
      } catch {
        if (!cancelled) setError('Unable to load trade assets')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAssets()
    return () => {
      cancelled = true
    }
  }, [selectedTeams])

  const teamName = useMemo(() => {
    const map = Object.fromEntries(teams.map((t) => [t.id, t.name]))
    return (id) => map[id] || `Team ${id}`
  }, [teams])

  function toggleTeam(id) {
    setSelectedTeams((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2 || Number(user?.team_id) === id) return prev
        return prev.filter((t) => t !== id)
      }
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
    setSuccess('')
  }

  function playerLabel(p) {
    return p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player ${p.id}`
  }

  function pickLabel(p) {
    return p.label || `${p.year || ''} R${p.round || '?'}`.trim() || `Pick ${p.id}`
  }

  function assignPlayer(player, fromTeamId, toTeamId) {
    if (toTeamId && toTeamId === fromTeamId) return
    setAllocations((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((tid) => {
        next[tid] = {
          ...next[tid],
          players: (next[tid].players || []).filter((id) => id !== player.id),
        }
      })
      if (!toTeamId) return next
      next[toTeamId] = {
        players: [...(next[toTeamId]?.players || []), player.id],
        draft_picks: next[toTeamId]?.draft_picks || [],
      }
      return next
    })
  }

  function assignPick(pick, fromTeamId, toTeamId) {
    if (toTeamId && toTeamId === fromTeamId) return
    setAllocations((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((tid) => {
        next[tid] = {
          ...next[tid],
          draft_picks: (next[tid].draft_picks || []).filter((id) => id !== pick.id),
        }
      })
      if (!toTeamId) return next
      next[toTeamId] = {
        players: next[toTeamId]?.players || [],
        draft_picks: [...(next[toTeamId]?.draft_picks || []), pick.id],
      }
      return next
    })
  }

  function removeFromColumn(teamId, kind, assetId) {
    setAllocations((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [kind]: (prev[teamId]?.[kind] || []).filter((id) => id !== assetId),
      },
    }))
  }

  function findPlayer(id) {
    for (const list of Object.values(rosters)) {
      const found = list.find((p) => p.id === id)
      if (found) return found
    }
    return { id, name: `Player ${id}` }
  }

  function findPick(id) {
    for (const list of Object.values(picks)) {
      const found = list.find((p) => p.id === id)
      if (found) return found
    }
    return { id, label: `Pick ${id}` }
  }

  async function submitTrade() {
    if (selectedTeams.length < 2 || selectedTeams.length > 4) {
      setError('Select 2 to 4 teams')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const players = []
      const draft_picks = []
      Object.entries(allocations).forEach(([toTeamId, bag]) => {
        ;(bag.players || []).forEach((playerId) => {
          players.push({ player_id: playerId, to_team_id: Number(toTeamId) })
        })
        ;(bag.draft_picks || []).forEach((pickId) => {
          draft_picks.push({ draft_pick_id: pickId, to_team_id: Number(toTeamId) })
        })
      })
      await api.post('/trades', {
        teams: selectedTeams,
        players,
        draft_picks,
      })
      setSuccess('Trade proposal submitted. It will remain pending until an admin reviews it.')
      setAllocations(
        Object.fromEntries(selectedTeams.map((id) => [id, { players: [], draft_picks: [] }]))
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Trade failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Propose a Trade"
        subtitle="Build a proposal with up to four teams. Players and picks stay put until an admin approves it."
      />
      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="panel trade-team-picker">
        <div className="trade-picker-heading">
          <div>
            <h2>Teams in this proposal</h2>
            <p>Select 2–4 teams. Your team is included automatically.</p>
          </div>
          <span className="trade-team-count">{selectedTeams.length}/4</span>
        </div>
        <div className="team-picker">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip${selectedTeams.includes(Number(t.id)) ? ' selected' : ''}${
                Number(user?.team_id) === Number(t.id) ? ' own-team' : ''
              }`}
              onClick={() => toggleTeam(Number(t.id))}
            >
              {t.name}
              {Number(user?.team_id) === Number(t.id) ? ' · Your team' : ''}
            </button>
          ))}
        </div>
      </div>

      {selectedTeams.length < 2 ? (
        <div className="panel empty-state">Select at least 2 teams to build a trade.</div>
      ) : loading ? (
        <div className="loading">Loading assets…</div>
      ) : (
        <>
          <section className="trade-section">
            <div className="trade-section-heading">
              <div>
                <h2>Trade summary</h2>
                <p>Review what each team receives before submitting the proposal.</p>
              </div>
            </div>
            <div className="trade-board trade-receive-board">
              {selectedTeams.map((tid) => (
                <div className="trade-column trade-receive-card" key={`recv-${tid}`}>
                  <h3>
                    <span className="trade-team-dot" />
                    {teamName(tid)}
                  </h3>
                  <div className="trade-receive-label">Receives</div>
                  {(allocations[tid]?.players || []).map((pid) => (
                    <div className="trade-item" key={`p-${pid}`}>
                      <span>
                        <small>PLAYER</small>
                        {playerLabel(findPlayer(pid))}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${playerLabel(findPlayer(pid))} from ${teamName(tid)}'s incoming assets`}
                        onClick={() => removeFromColumn(tid, 'players', pid)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(allocations[tid]?.draft_picks || []).map((pid) => (
                    <div className="trade-item" key={`d-${pid}`}>
                      <span>
                        <small>DRAFT PICK</small>
                        {pickLabel(findPick(pid))}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${pickLabel(findPick(pid))} from ${teamName(tid)}'s incoming assets`}
                        onClick={() => removeFromColumn(tid, 'draft_picks', pid)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(allocations[tid]?.players || []).length === 0 &&
                  (allocations[tid]?.draft_picks || []).length === 0 ? (
                    <div className="trade-empty-receive">No assets selected yet</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="trade-section">
            <div className="trade-section-heading">
              <div>
                <h2>Available players and picks</h2>
                <p>Choose which team receives each asset. The admin will review the complete proposal.</p>
              </div>
            </div>
            <div className="trade-board trade-asset-board">
              {selectedTeams.map((tid) => (
                <div className="trade-column trade-asset-card" key={`src-${tid}`}>
                  <h3>
                    <span className="trade-team-dot" />
                    {teamName(tid)}
                  </h3>
                  <div className="trade-receive-label">Available to trade</div>
                  {(rosters[tid] || []).length > 0 ? (
                    <h4 className="trade-asset-subheading">Players</h4>
                  ) : null}
                  {(rosters[tid] || []).map((p) => (
                    <div className="trade-item" key={p.id}>
                      <span>
                        <small>{p.position || 'PLAYER'}</small>
                        {playerLabel(p)}
                      </span>
                      <select
                        defaultValue=""
                        aria-label={`Send ${playerLabel(p)} from ${teamName(tid)}`}
                        onChange={(e) => {
                          assignPlayer(p, tid, Number(e.target.value))
                          e.target.value = ''
                        }}
                      >
                        <option value="">Keep player</option>
                        {selectedTeams
                          .filter((id) => id !== tid)
                          .map((id) => (
                            <option key={id} value={id}>
                              {teamName(id)}
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                  {(picks[tid] || []).length > 0 ? (
                    <h4 className="trade-asset-subheading">Draft picks</h4>
                  ) : null}
                  {(picks[tid] || []).map((pk) => (
                    <div className="trade-item" key={`pick-${pk.id}`}>
                      <span>
                        <small>DRAFT PICK</small>
                        {pickLabel(pk)}
                      </span>
                      <select
                        defaultValue=""
                        aria-label={`Send ${pickLabel(pk)} from ${teamName(tid)}`}
                        onChange={(e) => {
                          assignPick(pk, tid, Number(e.target.value))
                          e.target.value = ''
                        }}
                      >
                        <option value="">Keep pick</option>
                        {selectedTeams
                          .filter((id) => id !== tid)
                          .map((id) => (
                            <option key={id} value={id}>
                              {teamName(id)}
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                  {(rosters[tid] || []).length === 0 && (picks[tid] || []).length === 0 ? (
                    <div className="trade-empty-receive">No players or draft picks available</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <div className="trade-submit-bar">
            <p>Submitting creates a pending proposal. No roster or draft-pick changes happen before approval.</p>
            <button type="button" className="btn btn-danger" onClick={submitTrade} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit trade proposal'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
