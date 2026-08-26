import ContractsPage from '../shared/ContractsPage'
import { useAuth } from '../../context/AuthContext'

export default function TeamContracts() {
  const { user } = useAuth()
  return <ContractsPage title="Contracts" fixedTeamId={user?.team_id} />
}
