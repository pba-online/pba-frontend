import { useState } from 'react'
import api from '../api/client'
import {
  RATING_KEYS,
  formatMoney,
  getRatingValue,
  playerPhoto,
} from '../utils/helpers'

export default function PlayerCardModal({
  player,
  seasonId,
  onClose,
  editable = false,
  detailsEditable = false,
  onSaved,
  onPlayerSaved,
}) {
  const [savedDetails, setSavedDetails] = useState(() => getPlayerDetails(player))
  const [details, setDetails] = useState(() => getPlayerDetails(player))
  const [savedRatings, setSavedRatings] = useState(() => getPlayerRatings(player))
  const [ratings, setRatings] = useState(() => getPlayerRatings(player))
  const [editing, setEditing] = useState(false)
  const [detailsEditing, setDetailsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [error, setError] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [success, setSuccess] = useState('')

  if (!player) return null

  const name = player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Player'
  const overall = ratings.overall ?? getRatingValue(player, 'overall') ?? player.overall ?? 0
  const thisYear =
    player.this_year_salary ??
    player.current_salary ??
    player.salary_this_year ??
    player.contract?.this_year_salary
  const fullSalary =
    player.full_contract_salary ??
    player.total_salary ??
    player.contract_total ??
    player.contract?.total_salary

  async function handleDetailsSave(event) {
    event.preventDefault()
    if (!seasonId) {
      setDetailsError('Select a season before editing player details.')
      return
    }

    const heightText = details.height.trim()
    const heightMatch = heightText.match(/^(\d{1,2})['\u2019](\d{1,2})"?$/)
    const heightInches = heightText ? Number(heightMatch?.[1]) * 12 + Number(heightMatch?.[2]) : null
    if (heightText && (!heightMatch || Number(heightMatch[2]) > 11 || heightInches < 48 || heightInches > 96)) {
      setDetailsError("Enter height as feet'inches, between 4'0 and 8'0.")
      return
    }

    setDetailsSaving(true)
    setDetailsError('')
    setSuccess('')
    try {
      const { data } = await api.put(`/players/${player.id}`, {
        season_id: Number(seasonId),
        birth_date: details.birth_date || null,
        height_inches: heightInches,
        weight_lbs: details.weight_lbs === '' ? null : Number(details.weight_lbs),
        position: [details.position, details.secondary_position].filter(Boolean).join('/') || null,
        jersey_number: details.jersey_number === '' ? null : Number(details.jersey_number),
      })
      setSavedDetails(getPlayerDetails(data.player))
      setDetails(getPlayerDetails(data.player))
      onPlayerSaved?.(data.player)
      setDetailsEditing(false)
      setSuccess('Player details saved')
    } catch (err) {
      setDetailsError(err.response?.data?.errors?.jersey_number?.[0] || err.response?.data?.message || 'Failed to save player details')
    } finally {
      setDetailsSaving(false)
    }
  }

  function cancelDetailsEdit() {
    setDetails(savedDetails)
    setDetailsEditing(false)
    setDetailsError('')
  }

  async function handleSave() {
    if (!seasonId) {
      setError('Select a season before editing ratings.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.put(`/players/${player.id}/ratings`, {
        ...ratings,
        season_id: seasonId,
      })
      onSaved?.(data.ratings, data.season_id)
      setSavedRatings(data.ratings)
      setRatings(data.ratings)
      setEditing(false)
      setSuccess('Ratings saved')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save ratings')
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setRatings(savedRatings)
    setEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="player-card-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${name} player card`}
      >
        <button type="button" className="player-card-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="player-card-top">
          <div className="player-photo-wrap">
            <img
              src={playerPhoto(player)}
              alt={name}
              onError={(e) => {
                e.currentTarget.src = '/players/default.png'
              }}
            />
            <div className="overall-badge">{overall}</div>
          </div>

          <div className="player-meta">
            <h2>{name}</h2>
            <div className="meta-row">
              <span>Position: {player.position || '—'}</span>
              <span>Age: {player.age ?? '—'}</span>
              <span>Height: {player.height || '—'}</span>
              <span>Weight: {player.weight ? `${player.weight} lbs` : '—'}</span>
              <span>Jersey: #{player.jersey_number ?? '—'}</span>
              <span>Born: {formatBirthDate(player.birth_date)}</span>
            </div>
            <div className="salary-box">
              <div>
                <div className="lbl">This year</div>
                <div className="val">{formatMoney(thisYear)}</div>
              </div>
              <div>
                <div className="lbl">Full contract</div>
                <div className="val">{formatMoney(fullSalary)}</div>
              </div>
            </div>
            {detailsEditable && !detailsEditing ? (
              <button type="button" className="btn btn-ghost btn-sm player-details-edit" onClick={() => setDetailsEditing(true)}>
                Edit Player Details
              </button>
            ) : null}
          </div>
        </div>

        {detailsEditable && detailsEditing ? (
          <form className="player-details-editor" onSubmit={handleDetailsSave}>
            {detailsError ? <div className="error-banner player-details-error">{detailsError}</div> : null}
            <div className="player-details-fields">
              <label>
                Primary position
                <select value={details.position} onChange={(event) => setDetails({ ...details, position: event.target.value })}>
                  <option value="">No position</option>
                  {details.position && !['PG', 'SG', 'SF', 'PF', 'C'].includes(details.position) ? (
                    <option value={details.position}>{details.position}</option>
                  ) : null}
                  {['PG', 'SG', 'SF', 'PF', 'C'].map((position) => <option key={position} value={position}>{position}</option>)}
                </select>
              </label>
              <label>
                Secondary position
                <select value={details.secondary_position} onChange={(event) => setDetails({ ...details, secondary_position: event.target.value })}>
                  <option value="">None</option>
                  {details.secondary_position && !['PG', 'SG', 'SF', 'PF', 'C'].includes(details.secondary_position) ? (
                    <option value={details.secondary_position}>{details.secondary_position}</option>
                  ) : null}
                  {['PG', 'SG', 'SF', 'PF', 'C'].map((position) => (
                    <option key={position} value={position} disabled={position === details.position}>{position}</option>
                  ))}
                </select>
              </label>
              <label>
                Birthdate
                <input type="date" max={new Date().toISOString().slice(0, 10)} value={details.birth_date} onChange={(event) => setDetails({ ...details, birth_date: event.target.value })} />
              </label>
              <label>
                Height
                <input type="text" placeholder={'6\'5"'} value={details.height} onChange={(event) => setDetails({ ...details, height: event.target.value })} />
              </label>
              <label>
                Weight (lb)
                <input type="number" min="1" max="500" value={details.weight_lbs} onChange={(event) => setDetails({ ...details, weight_lbs: event.target.value })} />
              </label>
              <label>
                Jersey number
                <input type="number" min="0" max="99" value={details.jersey_number} onChange={(event) => setDetails({ ...details, jersey_number: event.target.value })} />
              </label>
            </div>
            <div className="player-details-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={cancelDetailsEdit} disabled={detailsSaving}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={detailsSaving}>{detailsSaving ? 'Saving…' : 'Save details'}</button>
            </div>
          </form>
        ) : null}

        <div className="attr-section">
          <h3>Attributes</h3>
          {error ? <div className="error-banner">{error}</div> : null}
          {success ? <div className="success-banner">{success}</div> : null}
          <div className="attr-grid">
            {RATING_KEYS.filter((r) => r.key !== 'overall').map(({ key, label }) => {
              const val = ratings[key] ?? 0
              return (
                <div className="attr-row" key={key}>
                  <span>{label}</span>
                  <div className="attr-bar">
                    <span style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
                  </div>
                  {editable && editing ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={val}
                      onChange={(e) =>
                        setRatings((prev) => ({
                          ...prev,
                          [key]: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <strong>{val}</strong>
                  )}
                </div>
              )
            })}
              {editable && editing ? (
              <div className="attr-row">
                <span>Overall</span>
                <div className="attr-bar">
                  <span style={{ width: `${Math.min(100, Math.max(0, ratings.overall || 0))}%` }} />
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ratings.overall || 0}
                  onChange={(e) =>
                    setRatings((prev) => ({
                      ...prev,
                      overall: Number(e.target.value),
                    }))
                  }
                />
              </div>
            ) : null}
          </div>
        </div>

        {editable ? (
          <div className="modal-actions">
            {editing ? (
              <>
                <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save ratings'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
                  Edit Ratings
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function getPlayerRatings(player) {
  const ratings = {}
  RATING_KEYS.forEach(({ key }) => {
    ratings[key] = getRatingValue(player, key)
  })
  return ratings
}

function getPlayerDetails(player) {
  const inches = Number(player?.height_inches)
  const height = player?.height || (inches ? `${Math.floor(inches / 12)}'${inches % 12}` : '')
  const [position = '', secondaryPosition = ''] = String(player?.position || '').split('/').map((part) => part.trim())
  return {
    birth_date: player?.birth_date?.slice(0, 10) || '',
    height,
    weight_lbs: player?.weight_lbs ?? player?.weight ?? '',
    position,
    secondary_position: secondaryPosition,
    jersey_number: player?.jersey_number ?? '',
  }
}

function formatBirthDate(value) {
  if (!value) return '—'

  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
