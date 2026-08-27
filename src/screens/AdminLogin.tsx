import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../components/Layout'
import { useApp } from '../store/AppStore'

export const AdminLogin = () => {
  const { dispatch } = useApp()
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('campus123')
  const [error, setError] = useState('')
  const submit = () => {
    if (username === 'admin' && password === 'campus123') {
      dispatch({ type: 'admin', value: true })
      navigate('/admin')
    } else {
      setError('Use the demo credentials: admin / campus123')
    }
  }
  return (
    <div className="mx-auto max-w-md">
      <PageTitle eyebrow="Campus Circular operations" title="Admin login" />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <ShieldCheck />
        </div>
        <p className="mt-5 text-sm text-slate-500">
          Manage trust, listings, exchanges, and disputes in demo mode.
        </p>
        <label className="mt-6 block text-xs font-bold text-slate-600">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="field"
          />
        </label>
        <label className="mt-4 block text-xs font-bold text-slate-600">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
          />
        </label>
        {error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
        <button
          onClick={submit}
          className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white"
        >
          Enter admin console
        </button>
        <p className="mt-4 text-center text-[11px] text-slate-400">Demo: admin · campus123</p>
      </div>
    </div>
  )
}
