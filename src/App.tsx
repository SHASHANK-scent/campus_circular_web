import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AppStore } from './store/AppStore'
import { Discover } from './screens/Discover'
import { Need } from './screens/Need'
import { Item } from './screens/Item'
import { Profile } from './screens/Profile'
import { Agreement } from './screens/Agreement'
import { Exchanges } from './screens/Exchanges'
import { ExchangeDetail } from './screens/ExchangeDetail'
import { ListResource } from './screens/ListResource'
import { Requests } from './screens/Requests'
import { Impact } from './screens/Impact'
import { AdminLogin } from './screens/AdminLogin'
import { Admin } from './screens/Admin'
import { Login } from './screens/Login'
import { Verify } from './screens/Verify'
import { useApp } from './store/AppStore'
import { ownerVerificationLevel } from './lib/verification'
const RequireVerified = ({ children }: { children: React.ReactNode }) => {
  const { state } = useApp()
  const location = useLocation()
  if (!state.session?.loggedIn) return <Navigate to="/login" replace />
  const user = state.users.find((item) => item.id === state.currentUserId)
  if (!user || ownerVerificationLevel(user.verification) !== 'Fully Verified') {
    return <Navigate to="/verify-me" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
export default function App() {
  return (
    <AppStore>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify-me" element={<Verify />} />
            <Route path="/" element={<RequireVerified><Discover /></RequireVerified>} />
            <Route path="/need" element={<RequireVerified><Need /></RequireVerified>} />
            <Route path="/item/:id" element={<RequireVerified><Item /></RequireVerified>} />
            <Route path="/profile/:id" element={<RequireVerified><Profile /></RequireVerified>} />
            <Route path="/agreement/:resourceId" element={<RequireVerified><Agreement /></RequireVerified>} />
            <Route path="/exchanges" element={<RequireVerified><Exchanges /></RequireVerified>} />
            <Route path="/exchanges/:id" element={<RequireVerified><ExchangeDetail /></RequireVerified>} />
            <Route path="/list" element={<RequireVerified><ListResource /></RequireVerified>} />
            <Route path="/requests" element={<RequireVerified><Requests /></RequireVerified>} />
            <Route path="/impact" element={<RequireVerified><Impact /></RequireVerified>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppStore>
  )
}
