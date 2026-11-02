import { useEffect, useState } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import ConferenceFilter from '../../components/ConferenceFilter'
import { unwrapList } from '../../utils/helpers'

export default function TransactionsPage({
  title = 'Transactions',
  highlightTeamId = null,
  isAdmin = false,
}) {
  const [conferenceId, setConferenceId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingTrades, setPendingTrades] = useState([])
  const [pendingLoading, setPendingLoading] = useState(isAdmin)
  const [pendingError, setPendingError] = useState('')
  const [reviewingTradeId, setReviewingTradeId] = useState(null)

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

  useEffect(() => {
    if (!isAdmin) return
    api
      .get('/trades/pending')
      .then((res) => setPendingTrades(unwrapList(res.data)))
      .catch(() => {
        setPendingError('Unable to load pending trade proposals')
        setPendingTrades([])
      })
      .finally(() => setPendingLoading(false))
  }, [isAdmin])

  async function reviewTrade(trade, decision) {
    setReviewingTradeId(trade.id)
    setPendingError('')
    try {
      await api.post(`/trades/${trade.id}/${decision}`)
      setPendingTrades((current) => current.filter((item) => item.id !== trade.id))
      if (decision === 'approve') {
        const params = conferenceId ? { conference_id: conferenceId } : {}
        try {
          const response = await api.get('/transactions', { params })
          setRows(unwrapList(response.data))
        } catch {
          setError('Trade approved, but the transaction list could not be refreshed.')
        }
      }
    } catch (reviewError) {
      setPendingError(
        reviewError.response?.data?.message ||
          (decision === 'approve'
            ? 'Trade could not be approved. Refresh and try again.'
            : 'Trade could not be declined. Refresh and try again.')
      )
    } finally {
      setReviewingTradeId(null)
    }
  }

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
      {isAdmin ? (
        <section className="panel trade-review-panel">
          <div className="trade-review-heading">
            <div>
              <h2>Trade proposals</h2>
              <p>Review and approve or decline pending team proposals.</p>
            </div>
            {!pendingLoading ? (
              <span className="trade-team-count">{pendingTrades.length} pending</span>
            ) : null}
          </div>
          {pendingError ? <div className="error-banner">{pendingError}</div> : null}
          {pendingLoading ? (
            <div className="loading">Loading trade proposals…</div>
          ) : pendingTrades.length === 0 ? (
            <div className="empty-state">No pending trade proposals.</div>
          ) : (
            <div className="trade-review-list">
              {pendingTrades.map((trade) => {
                const assets = [
                  ...(trade.players || []).map((player) => ({
                    id: `player-${player.id}`,
                    label: player.name || `Player ${player.id}`,
                    type: 'Player',
                    from: player.from_team,
                    to: player.to_team,
                  })),
                  ...(trade.draft_picks || []).map((pick) => ({
                    id: `pick-${pick.id}`,
                    label: pick.label || `Pick ${pick.id}`,
                    type: 'Draft pick',
                    from: pick.from_team,
                    to: pick.to_team,
                  })),
                ]
                return (
                  <article className="trade-review-card" key={trade.id}>
                    <div className="trade-review-card-heading">
                      <div>
                        <h3>Proposal #{trade.id}</h3>
                        <p>{(trade.teams || []).map((team) => team.name).filter(Boolean).join(' · ')}</p>
                      </div>
                      <span className="trade-status-pending">Pending</span>
                    </div>
                    {trade.description ? <p className="trade-review-description">{trade.description}</p> : null}
                    <div className="trade-review-assets">
                      {assets.map((asset) => (
                        <div className="trade-review-asset" key={asset.id}>
                          <span><small>{asset.type}</small>{asset.label}</span>
                          <span>{asset.from || '—'} <strong>→</strong> {asset.to || '—'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="trade-review-actions">
                      <span>
                        Submitted {trade.created_at ? new Date(trade.created_at).toLocaleDateString() : ''}
                        {trade.created_by ? ` by ${trade.created_by}` : ''}
                      </span>
                      <div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => reviewTrade(trade, 'decline')}
                          disabled={reviewingTradeId === trade.id}
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => reviewTrade(trade, 'approve')}
                          disabled={reviewingTradeId === trade.id}
                        >
                          {reviewingTradeId === trade.id ? 'Saving…' : 'Approve trade'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      ) : null}
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
