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
          setSelectedTeams([user.team_id])
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
        if (prev.length <= 2 && user?.team_id === id) return prev
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
    if (!toTeamId || toTeamId === fromTeamId) return
    setAllocations((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((tid) => {
        next[tid] = {
          ...next[tid],
          players: (next[tid].players || []).filter((id) => id !== player.id),
        }
      })
      next[toTeamId] = {
        players: [...(next[toTeamId]?.players || []), player.id],
        draft_picks: next[toTeamId]?.draft_picks || [],
      }
      return next
    })
  }

  function assignPick(pick, fromTeamId, toTeamId) {
    if (!toTeamId || toTeamId === fromTeamId) return
    setAllocations((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((tid) => {
        next[tid] = {
          ...next[tid],
          draft_picks: (next[tid].draft_picks || []).filter((id) => id !== pick.id),
        }
      })
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
      setSuccess('Trade submitted')
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
        title="Trade"
        subtitle="Select 2–4 teams, then move players and draft picks between columns."
      />
      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: 'var(--blue-dark)' }}>
          Teams in trade ({selectedTeams.length}/4)
        </h3>
        <div className="team-picker">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip${selectedTeams.includes(t.id) ? ' selected' : ''}`}
              onClick={() => toggleTeam(t.id)}
            >
              {t.name}
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
          <div className="trade-board" style={{ marginBottom: '1.25rem' }}>
            {selectedTeams.map((tid) => (
              <div className="trade-column" key={`recv-${tid}`}>
                <h3>Receives → {teamName(tid)}</h3>
                {(allocations[tid]?.players || []).map((pid) => (
                  <div className="trade-item" key={`p-${pid}`}>
                    <span>{playerLabel(findPlayer(pid))}</span>
                    <button type="button" onClick={() => removeFromColumn(tid, 'players', pid)}>
                      ×
                    </button>
                  </div>
                ))}
                {(allocations[tid]?.draft_picks || []).map((pid) => (
                  <div className="trade-item" key={`d-${pid}`}>
                    <span>{pickLabel(findPick(pid))}</span>
                    <button type="button" onClick={() => removeFromColumn(tid, 'draft_picks', pid)}>
                      ×
                    </button>
                  </div>
                ))}
                {(allocations[tid]?.players || []).length === 0 &&
                (allocations[tid]?.draft_picks || []).length === 0 ? (
                  <div className="empty-state" style={{ padding: '1rem' }}>
                    Drop assets here
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="trade-board">
            {selectedTeams.map((tid) => (
              <div className="trade-column" key={`src-${tid}`}>
                <h3>{teamName(tid)} assets</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  Send player/pick to another team
                </p>
                {(rosters[tid] || []).map((p) => (
                  <div className="trade-item" key={p.id}>
                    <span>{playerLabel(p)}</span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        assignPlayer(p, tid, Number(e.target.value))
                        e.target.value = ''
                      }}
                    >
                      <option value="">Send to…</option>
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
                {(picks[tid] || []).map((pk) => (
                  <div className="trade-item" key={`pick-${pk.id}`}>
                    <span>{pickLabel(pk)}</span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        assignPick(pk, tid, Number(e.target.value))
                        e.target.value = ''
                      }}
                    >
                      <option value="">Send to…</option>
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
                  <div className="empty-state" style={{ padding: '1rem' }}>
                    No data
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-danger" onClick={submitTrade} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit trade'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
