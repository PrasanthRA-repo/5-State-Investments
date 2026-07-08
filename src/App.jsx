import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LoginGate from './components/LoginGate'
import OverallDashboard from './pages/OverallDashboard'
import IndividualDashboard from './pages/IndividualDashboard'
import TransactionDashboard from './pages/TransactionDashboard'
import ProjectsPage from './pages/ProjectsPage'

export default function App() {
  return (
    <LoginGate>
      <Layout>
        <Routes>
          <Route path="/" element={<OverallDashboard />} />
          <Route path="/me" element={<IndividualDashboard />} />
          <Route path="/transactions" element={<TransactionDashboard />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </Layout>
    </LoginGate>
  )
}
