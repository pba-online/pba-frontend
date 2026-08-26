import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import TeamLayout from './layouts/TeamLayout'
import FanLayout from './layouts/FanLayout'
import Landing from './pages/Landing'

import AdminDashboard from './pages/admin/Dashboard'
import AdminTeams from './pages/admin/Teams'
import AdminRoster from './pages/admin/Roster'
import AdminHomecourt from './pages/admin/Homecourt'
import AdminSeasons from './pages/admin/Seasons'
import AdminContracts from './pages/admin/Contracts'
import AdminTransactions from './pages/admin/Transactions'
import AdminStandings from './pages/admin/Standings'
import AdminPlayoffs from './pages/admin/Playoffs'
import AdminAwards from './pages/admin/Awards'
import AdminLeagueHistory from './pages/admin/LeagueHistory'
import AdminDraft from './pages/admin/Draft'
import AdminFreeAgents from './pages/admin/FreeAgents'
import AdminFreeAgentsCoach from './pages/admin/FreeAgentsCoach'

import TeamDashboard from './pages/team/Dashboard'
import TeamRoster from './pages/team/Roster'
import TeamCoachStaff from './pages/team/CoachStaff'
import TeamContracts from './pages/team/Contracts'
import TeamTrade from './pages/team/Trade'
import TeamFreeAgent from './pages/team/FreeAgent'
import TeamCoachFreeAgent from './pages/team/CoachFreeAgent'
import TeamTransactions from './pages/team/Transactions'
import TeamSchedule from './pages/team/Schedule'
import TeamStandings from './pages/team/Standings'
import TeamDraftPicks from './pages/team/DraftPicks'
import TeamAwards from './pages/team/Awards'

import FansDashboard from './pages/fans/Dashboard'
import FansRoster from './pages/fans/Roster'
import FansTransactions from './pages/fans/Transactions'
import FansStandings from './pages/fans/Standings'
import FansPlayoffs from './pages/fans/Playoffs'
import FansAwards from './pages/fans/Awards'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="roster" element={<AdminRoster />} />
        <Route path="homecourt" element={<AdminHomecourt />} />
        <Route path="seasons" element={<AdminSeasons />} />
        <Route path="contracts" element={<AdminContracts />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="standings" element={<AdminStandings />} />
        <Route path="playoffs" element={<AdminPlayoffs />} />
        <Route path="awards" element={<AdminAwards />} />
        <Route path="league-history" element={<AdminLeagueHistory />} />
        <Route path="draft" element={<AdminDraft />} />
        <Route path="free-agents" element={<AdminFreeAgents />} />
        <Route path="free-agents-coach" element={<AdminFreeAgentsCoach />} />
      </Route>

      <Route path="/team" element={<TeamLayout />}>
        <Route index element={<TeamDashboard />} />
        <Route path="roster" element={<TeamRoster />} />
        <Route path="coach-staff" element={<TeamCoachStaff />} />
        <Route path="contracts" element={<TeamContracts />} />
        <Route path="trade" element={<TeamTrade />} />
        <Route path="free-agent" element={<TeamFreeAgent />} />
        <Route path="coach-free-agent" element={<TeamCoachFreeAgent />} />
        <Route path="transactions" element={<TeamTransactions />} />
        <Route path="schedule" element={<TeamSchedule />} />
        <Route path="standings" element={<TeamStandings />} />
        <Route path="draft-picks" element={<TeamDraftPicks />} />
        <Route path="awards" element={<TeamAwards />} />
      </Route>

      <Route path="/fans" element={<FanLayout />}>
        <Route index element={<FansDashboard />} />
        <Route path="roster" element={<FansRoster />} />
        <Route path="transactions" element={<FansTransactions />} />
        <Route path="standings" element={<FansStandings />} />
        <Route path="playoffs" element={<FansPlayoffs />} />
        <Route path="awards" element={<FansAwards />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
