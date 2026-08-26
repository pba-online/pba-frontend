import TransactionsPage from '../shared/TransactionsPage'
import { useAuth } from '../../context/AuthContext'

export default function TeamTransactions() {
  const { user } = useAuth()
  return <TransactionsPage title="Transactions" highlightTeamId={user?.team_id} />
}
