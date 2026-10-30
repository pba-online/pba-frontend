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
  { key: 'inside_scoring', label: 'Inside Scoring' },
  { key: 'mid_range', label: 'Mid-Range' },
  { key: 'three_point', label: '3PT' },
  { key: 'free_throw', label: 'FT' },
  { key: 'finishing', label: 'Finishing' },
  { key: 'dunking', label: 'Dunking' },
  { key: 'passing', label: 'Passing' },
  { key: 'ball_handling', label: 'Ball Handling' },
  { key: 'perimeter_defense', label: 'Perimeter Defense' },
  { key: 'interior_defense', label: 'Interior Defense' },
  { key: 'stealing', label: 'Stealing' },
  { key: 'blocking', label: 'Blocking' },
  { key: 'offensive_rebound', label: 'Offensive Rebound' },
  { key: 'defensive_rebound', label: 'Defensive Rebound' },
  { key: 'speed', label: 'Speed' },
  { key: 'acceleration', label: 'Accel' },
  { key: 'strength', label: 'Strength' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'consistency', label: 'Consistency' },
]

export function getRatingValue(player, key) {
  const ratings = player?.ratings || player?.player_ratings || player
  const val = ratings?.[key]
  return val == null ? 0 : Number(val)
}
