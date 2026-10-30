import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import SeasonFilter from '../../components/SeasonFilter'
import PlayerCardModal from '../../components/PlayerCardModal'
import GradeBadge from '../../components/GradeBadge'
import { formatMoney, getRatingValue, unwrapList } from '../../utils/helpers'

const COACH_GRADE_FIELDS = [
  ['offense_grade', 'Offense'],
  ['defense_grade', 'Defense'],
  ['player_development_grade', 'Player development'],
  ['leadership_grade', 'Leadership'],
  ['overall_grade', 'Overall'],
]
const COACH_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-']

export default function AdminRoster() {
  const [mode, setMode] = useState('players')
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [editingCoachId, setEditingCoachId] = useState(null)
  const [coachGradeDraft, setCoachGradeDraft] = useState(null)
  const [savingCoachGrades, setSavingCoachGrades] = useState(false)

  useEffect(() => {
    api
      .get('/teams')
      .then((res) => setTeams(unwrapList(res.data)))
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (mode === 'players') {
          const params = {}
          if (teamId) params.team_id = teamId
          if (seasonId) params.season_id = seasonId
          const res = await api.get('/rosters', { params })
          setRows(unwrapList(res.data))
        } else {
          const params = {}
          if (teamId) params.team_id = teamId
          const res = await api.get('/coaches/staff', { params })
          setRows(unwrapList(res.data))
        }
      } catch {
        setError('Unable to load roster')
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [mode, teamId, seasonId])

  function editCoachGrades(coach) {
    if (editingCoachId === coach.id) {
      setEditingCoachId(null)
      setCoachGradeDraft(null)
      return
    }

    setEditingCoachId(coach.id)
    setCoachGradeDraft(Object.fromEntries(
      COACH_GRADE_FIELDS.map(([field]) => [field, coach[field] || ''])
    ))
  }

  async function saveCoachGrades() {
    setSavingCoachGrades(true)
    setError('')
    try {
      const { data } = await api.put(`/coaches/${editingCoachId}/ratings`, coachGradeDraft)
      setRows((current) => current.map((coach) =>
        coach.id === editingCoachId ? { ...coach, ...data.ratings } : coach
      ))
      setEditingCoachId(null)
      setCoachGradeDraft(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save coach grades')
    } finally {
      setSavingCoachGrades(false)
    }
  }

  function updatePlayerRatings(ratings, savedSeasonId) {
    if (Number(savedSeasonId) !== Number(seasonId)) return

    setRows((current) => current.map((row) =>
      row.id === selected?.id ? { ...row, overall: ratings.overall, ratings } : row
    ))
  }

  function updatePlayerDetails(player) {
    setRows((current) => current.map((row) => row.id === player.id ? { ...row, ...player } : row))
    setSelected((current) => current?.id === player.id ? { ...current, ...player } : current)
  }

  return (
    <div>
      <PageHeader title="Roster" subtitle="Players and coaches with age, contracts, and ratings." />
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="toggle-group">
        <button type="button" className={mode === 'players' ? 'active' : ''} onClick={() => setMode('players')}>
          Players
        </button>
        <button type="button" className={mode === 'coaches' ? 'active' : ''} onClick={() => setMode('coaches')}>
          Coaches
        </button>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="roster-team">Team</label>
          <select
            id="roster-team"
            className="filter-select"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {mode === 'players' ? <SeasonFilter value={seasonId} onChange={setSeasonId} /> : null}
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No data</div>
        ) : mode === 'players' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Position</th>
                  <th>Height</th>
                  <th>Team</th>
                  <th>Age</th>
                  <th>Overall</th>
                  <th>This year</th>
                  <th>Contract</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
                  return (
                    <tr key={p.id} className="clickable" onClick={() => setSelected(p)}>
                      <td>{name}</td>
                      <td>{p.position || '—'}</td>
                      <td>{p.height || '—'}</td>
                      <td>{p.team?.name || p.team_name || '—'}</td>
                      <td>{p.age ?? '—'}</td>
                      <td>{getRatingValue(p, 'overall') || p.overall || '—'}</td>
                      <td>
                        {formatMoney(
                          p.this_year_salary ?? p.current_salary ?? p.contract?.this_year_salary
                        )}
                      </td>
                      <td>
                        {formatMoney(
                          p.full_contract_salary ?? p.total_salary ?? p.contract?.total_salary
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Offense</th>
                  <th>Defense</th>
                  <th>Dev</th>
                  <th>Leadership</th>
                  <th>Overall</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <>
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.role || c.position || '—'}</td>
                      <td>{c.team?.name || c.team_name || '—'}</td>
                      <td><GradeBadge grade={c.offense_grade || c.offense} /></td>
                      <td><GradeBadge grade={c.defense_grade || c.defense} /></td>
                      <td><GradeBadge grade={c.player_development_grade || c.player_development} /></td>
                      <td><GradeBadge grade={c.leadership_grade || c.leadership} /></td>
                      <td><GradeBadge grade={c.overall_grade || c.overall} /></td>
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => editCoachGrades(c)}>
                          {editingCoachId === c.id ? 'Cancel' : 'Edit grades'}
                        </button>
                      </td>
                    </tr>
                    {editingCoachId === c.id ? (
                      <tr key={`${c.id}-grades`}>
                        <td colSpan={9}>
                          <form
                            className="filters-row"
                            onSubmit={(event) => {
                              event.preventDefault()
                              saveCoachGrades()
                            }}
                          >
                            {COACH_GRADE_FIELDS.map(([field, label]) => (
                              <div className="form-field" key={field} style={{ minWidth: 130, marginBottom: 0 }}>
                                <label htmlFor={`coach-${c.id}-${field}`}>{label}</label>
                                <select
                                  id={`coach-${c.id}-${field}`}
                                  value={coachGradeDraft[field]}
                                  onChange={(event) => setCoachGradeDraft({ ...coachGradeDraft, [field]: event.target.value })}
                                  required
                                >
                                  <option value="">Select grade</option>
                                  {COACH_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                                </select>
                              </div>
                            ))}
                            <button type="submit" className="btn btn-primary btn-sm" disabled={savingCoachGrades}>
                              {savingCoachGrades ? 'Saving…' : 'Save grades'}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ) : null}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlayerCardModal
        key={`${selected?.id || 'none'}-${seasonId || 'none'}`}
        player={selected}
        seasonId={seasonId}
        editable
        detailsEditable
        onClose={() => setSelected(null)}
        onSaved={updatePlayerRatings}
        onPlayerSaved={updatePlayerDetails}
      />
    </div>
  )
}
