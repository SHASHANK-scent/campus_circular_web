import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout, EmptyRoute } from './components/Layout'
import { AppStore } from './store/AppStore'
import { Discover } from './screens/Discover'
import { Need } from './screens/Need'
import { Item } from './screens/Item'
import { Profile } from './screens/Profile'
export default function App() { return <AppStore><BrowserRouter><Layout><Routes><Route path="/" element={<Discover />} /><Route path="/need" element={<Need />} /><Route path="/item/:id" element={<Item />} /><Route path="/profile/:id" element={<Profile />} /><Route path="*" element={<EmptyRoute title="This campus surface is queued for phase 2" />} /></Routes></Layout></BrowserRouter></AppStore> }
