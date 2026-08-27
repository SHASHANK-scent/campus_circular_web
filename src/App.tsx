import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout, EmptyRoute } from './components/Layout'
import { AppStore } from './store/AppStore'
import { Discover } from './screens/Discover'
import { Need } from './screens/Need'
import { Item } from './screens/Item'
import { Profile } from './screens/Profile'
import { Agreement } from './screens/Agreement'
import { Exchanges } from './screens/Exchanges'
import { ExchangeDetail } from './screens/ExchangeDetail'
export default function App() {
  return (
    <AppStore>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/need" element={<Need />} />
            <Route path="/item/:id" element={<Item />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/agreement/:resourceId" element={<Agreement />} />
            <Route path="/exchanges" element={<Exchanges />} />
            <Route path="/exchanges/:id" element={<ExchangeDetail />} />
            <Route
              path="*"
              element={<EmptyRoute title="This campus surface is queued for phase 2" />}
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppStore>
  )
}
