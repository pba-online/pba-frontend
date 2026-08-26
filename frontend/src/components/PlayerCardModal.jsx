import { useEffect, useState } from 'react'
import api from '../api/client'
import {
  RATING_KEYS,
  formatMoney,
  getRatingValue,
  playerPhoto,
} from '../utils/helpers'

export default function PlayerCardModal({ player, onClose, editable = false, onSaved }) {
  const [ratings, setRatings] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!player) return
    const next = {}
    RATING_KEYS.forEach(({ key }) => {
      next[key] = getRatingValue(player, key)
    })
    setRatings(next)
    setError('')
  }, [player])

  if (!player) return null

  const name = player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Player'
  const overall = ratings.overall || getRatingValue(player, 'overall') || player.overall || 0
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

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await api.put(`/players/${player.id}/ratings`, ratings)
      onSaved?.(ratings)
      onClose?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save ratings')
    } finally {
      setSaving(false)
    }
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
              <span>Age {player.age ?? '—'}</span>
              <span>{player.weight ? `${player.weight} lbs` : '— lbs'}</span>
              <span>{player.height || '—'}</span>
              {player.position ? <span>{player.position}</span> : null}
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
          </div>
        </div>

        <div className="attr-section">
          <h3>Attributes</h3>
          {error ? <div className="error-banner">{error}</div> : null}
          <div className="attr-grid">
            {RATING_KEYS.filter((r) => r.key !== 'overall').map(({ key, label }) => {
              const val = ratings[key] ?? 0
              return (
                <div className="attr-row" key={key}>
                  <span>{label}</span>
                  <div className="attr-bar">
                    <span style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
                  </div>
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      max={99}
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
            {editable ? (
              <div className="attr-row">
                <span>Overall</span>
                <div className="attr-bar">
                  <span style={{ width: `${Math.min(100, Math.max(0, ratings.overall || 0))}%` }} />
                </div>
                <input
                  type="number"
                  min={0}
                  max={99}
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save ratings'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
