import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import SeasonFilter from '../../components/SeasonFilter'
import { unwrapList } from '../../utils/helpers'
import { isAdmin as checkIsAdmin } from '../../utils/auth'

// Force a consistent division order regardless of what order the API returns
const DIVISION_ORDER = ['North', 'South']

function sortDivisions(groups) {
  return [...groups].sort((a, b) => {
    const ai = DIVISION_ORDER.indexOf(a.division)
    const bi = DIVISION_ORDER.indexOf(b.division)
    if (ai === -1 && bi === -1) return a.division.localeCompare(b.division)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export default function StandingsPage({ title = 'Standings' }) {
  const isAdmin = checkIsAdmin()

  const [seasonId, setSeasonId] = useState('')
  const [seasonInfo, setSeasonInfo] = useState(null) // { id, season_year, conference_season } from /standings response
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = (season) => {
    setLoading(true)
    setError('')
    const params = {}
    if (season) params.season_id = season
    api
      .get('/standings', { params })
      .then((res) => {
        setGroups(sortDivisions(unwrapList(res.data)))
        // The backend joins standings.season_id -> seasons.id and returns
        // the conference_season here, tied to the season actually queried.
        setSeasonInfo(res.data?.season ?? null)
      })
      .catch(() => {
        setError('Unable to load standings')
        setGroups([])
        setSeasonInfo(null)
      })
      .finally(() => setLoading(false))
  }

  // Load immediately on mount (backend defaults to the current season when
  // no season_id is passed), then reload whenever the user picks a season.
  useEffect(() => {
    load(seasonId)
  }, [seasonId])

  const startEdit = (row) => {
    if (!isAdmin) return
    setEditingTeamId(row.team_id)
    setDraft({
      team_id: row.team_id,
      season_id: row.season_id,
      wins: row.wins,
      losses: row.losses,
    })
  }

  const cancelEdit = () => {
    setEditingTeamId(null)
    setDraft(null)
  }

  const saveRow = async () => {
    if (!isAdmin) return
    setSaving(true)
    setError('')
    try {
      const res = await api.put('/standings/upsert', draft)
      const updated = res.data?.data ?? res.data
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          standings: g.standings.map((r) =>
            r.team_id === updated.team_id ? updated : r
          ),
        }))
      )
      cancelEdit()
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to save standing')
    } finally {
      setSaving(false)
    }
  }

  const updateDraft = (field, value) => setDraft((d) => ({ ...d, [field]: value }))

  const hasAnyRows = groups.some((g) => g.standings?.length > 0)

  // Label shown in the header — e.g. "All-Filipino Cup 2014-2015"
  const conferenceLabel = seasonInfo?.conference_season || null

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={
          conferenceLabel
            ? `Showing standings for ${conferenceLabel}.`
            : 'Filter by season.'
        }
      />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="filters-row">
        <SeasonFilter value={seasonId} onChange={setSeasonId} />
      </div>

      {conferenceLabel ? (
        <h2 className="conference-heading">{conferenceLabel}</h2>
      ) : null}

      {loading ? (
        <div className="panel">
          <div className="loading">Loading…</div>
        </div>
      ) : !hasAnyRows ? (
        <div className="panel">
          <div className="empty-state">No teams found</div>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.division} className="panel division-panel">
            <h3 className="division-title">{group.division} Division</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Win</th>
                    <th>Lose</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((r) =>
                    isAdmin && editingTeamId === r.team_id ? (
                      <tr key={r.team_id} className="editing-row">
                        <td>{r.team?.name || r.team_name || '—'}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={draft.wins}
                            onChange={(e) => updateDraft('wins', Number(e.target.value))}
                            className="input-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={draft.losses}
                            onChange={(e) => updateDraft('losses', Number(e.target.value))}
                            className="input-sm"
                          />
                        </td>
                        <td className="row-actions">
                          <button className="btn-link" onClick={saveRow} disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button className="btn-link" onClick={cancelEdit} disabled={saving}>
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.team_id}>
                        <td>{r.team?.name || r.team_name || '—'}</td>
                        <td>{r.wins}</td>
                        <td>{r.losses}</td>
                        {isAdmin && (
                          <td className="row-actions">
                            <button className="btn-link" onClick={() => startEdit(r)}>
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}