const GRADE_COLORS = {
  'A+': '#059669',
  A: '#10b981',
  'A-': '#34d399',
  'B+': '#2563eb',
  B: '#3b82f6',
  'B-': '#60a5fa',
  'C+': '#d97706',
  C: '#f59e0b',
  'C-': '#f97316',
}

export default function GradeBadge({ grade }) {
  if (!grade) return <span className="badge" style={{ background: '#e2e8f0', color: '#64748b' }}>—</span>
  const bg = GRADE_COLORS[grade] || '#64748b'
  return (
    <span className="badge" style={{ background: bg, color: 'white' }}>
      {grade}
    </span>
  )
}
