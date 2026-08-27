import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
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
export default function App() {
  return (
    <AppStore>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/need" element={<Need />} />
            <Route path="/item/:id" element={<Item />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/agreement/:resourceId" element={<Agreement />} />
            <Route path="/exchanges" element={<Exchanges />} />
            <Route path="/exchanges/:id" element={<ExchangeDetail />} />
            <Route path="/list" element={<ListResource />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/impact" element={<Impact />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppStore>
  )
}
