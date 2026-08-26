export function formatMoney(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(num)
}

export function playerPhoto(player) {
  return player?.photo_url || '/players/default.png'
}

export function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export const RATING_KEYS = [
  { key: 'overall', label: 'Overall' },
  { key: 'inside', label: 'Inside' },
  { key: 'mid_range', label: 'Mid-Range' },
  { key: 'three_point', label: '3PT' },
  { key: 'free_throw', label: 'FT' },
  { key: 'dunk', label: 'Dunk' },
  { key: 'layup', label: 'Layup' },
  { key: 'passing', label: 'Passing' },
  { key: 'ball_handle', label: 'Handle' },
  { key: 'speed', label: 'Speed' },
  { key: 'acceleration', label: 'Accel' },
  { key: 'strength', label: 'Strength' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'defense', label: 'Defense' },
  { key: 'steal', label: 'Steal' },
  { key: 'block', label: 'Block' },
  { key: 'rebound', label: 'Rebound' },
  { key: 'iq', label: 'IQ' },
]

export function getRatingValue(player, key) {
  const ratings = player?.ratings || player?.player_ratings || player
  const val = ratings?.[key]
  return val == null ? 0 : Number(val)
}
