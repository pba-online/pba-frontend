import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import ConferenceFilter from '../../components/ConferenceFilter'
import { unwrapList } from '../../utils/helpers'

export default function TransactionsPage({
  title = 'Transactions',
  highlightTeamId = null,
}) {
  const [conferenceId, setConferenceId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (conferenceId) params.conference_id = conferenceId
    api
      .get('/transactions', { params })
      .then((res) => setRows(unwrapList(res.data)))
      .catch(() => {
        setError('Unable to load transactions')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [conferenceId])

  function playerNames(tx) {
    if (tx.player_names) return tx.player_names
    if (Array.isArray(tx.players)) {
      return tx.players.map((p) => p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()).join(', ')
    }
    if (tx.player?.name) return tx.player.name
    if (tx.player_name) return tx.player_name
    return '—'
  }

  return (
    <div>
      <PageHeader title={title} subtitle="League moves with player names." />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="filters-row">
        <ConferenceFilter value={conferenceId} onChange={setConferenceId} />
      </div>
      <div className="panel">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No data</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Players</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => {
                  const highlight =
                    highlightTeamId != null &&
                    (tx.from_team_id === highlightTeamId ||
                      tx.to_team_id === highlightTeamId ||
                      tx.from_team?.id === highlightTeamId ||
                      tx.to_team?.id === highlightTeamId)
                  return (
                    <tr key={tx.id} className={highlight ? 'highlight' : ''}>
                      <td>{tx.date || tx.transaction_date || tx.created_at || '—'}</td>
                      <td>{tx.type || tx.transaction_type || '—'}</td>
                      <td>{playerNames(tx)}</td>
                      <td>{tx.from_team?.name || tx.from_team_name || '—'}</td>
                      <td>{tx.to_team?.name || tx.to_team_name || '—'}</td>
                      <td>{tx.notes || tx.description || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
