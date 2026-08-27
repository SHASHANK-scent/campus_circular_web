import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, Clock3, Leaf, RotateCcw, Sparkles } from 'lucide-react'
import { useApp } from '../store/AppStore'
export const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`
export const Avatar = ({ initials, className = '' }: { initials: string; className?: string }) => (
  <span
    className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ${className}`}
  >
    {initials}
  </span>
)
export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const current = state.users.find((user) => user.id === state.currentUserId) ?? state.users[0]
  const nav = [
    { to: '/', label: 'Discover' },
    { to: '/need', label: 'Need Something?' },
    { to: '/exchanges', label: 'My Exchanges' },
    { to: '/list', label: 'List Item' },
    { to: '/impact', label: 'Impact' },
    { to: '/admin', label: 'Admin' },
  ]
  return (
    <div className="min-h-screen bg-[#f7f8f6] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-5 py-3">
          <Link to="/" className="flex min-w-fit items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white">
              ↻
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight">Campus Circular</span>
              <span className="block text-[10px] font-medium text-slate-500">
                From Ownership to Access
              </span>
            </span>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-xs font-semibold transition ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="relative ml-auto flex items-center gap-2">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold shadow-sm"
            >
              <Clock3 className="h-3.5 w-3.5 text-amber-500" /> Demo{' '}
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => navigate(`/profile/${current.id}`)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-sm"
            >
              <Avatar initials={current.avatarInitials} className="h-7 w-7" />
              <span className="hidden text-left sm:block">
                <span className="block text-[11px] font-bold">{current.name.split(' ')[0]}</span>
                <span className="block text-[10px] text-emerald-700">
                  Trust {current.trustScore}
                </span>
              </span>
            </button>
            {open && (
              <div className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Simulated time
                </p>
                <p className="mb-3 text-xs font-semibold text-slate-700">
                  {new Date(state.simulatedNow).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    [1, '+1h'],
                    [24, '+1d'],
                    [72, '+3d'],
                  ].map(([hours, label]) => (
                    <button
                      key={label}
                      onClick={() => dispatch({ type: 'advance', hours: Number(hours) })}
                      className="rounded-lg bg-amber-50 px-2 py-2 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="mt-3 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Switch user
                </label>
                <select
                  value={current.id}
                  onChange={(event) => dispatch({ type: 'switchUser', userId: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs"
                >
                  {state.users.slice(0, 5).map((user) => (
                    <option value={user.id} key={user.id}>
                      {user.name} · {user.trustScore}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => dispatch({ type: 'reset' })}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
      <footer className="mx-auto mt-10 flex max-w-7xl items-center justify-between border-t border-slate-200 px-5 py-7 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Leaf className="h-3.5 w-3.5 text-emerald-500" /> Share more. Own less.
        </span>
        <span>Made for campus communities · Demo mode</span>
      </footer>
    </div>
  )
}
export const PageTitle = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: React.ReactNode
}) => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{title}</h1>
    </div>
    {children}
  </div>
)
export const Badge = ({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode
  tone?: 'slate' | 'green' | 'amber' | 'rose'
}) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}
  >
    {children}
  </span>
)
export const EmptyRoute = ({ title }: { title: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
    <Sparkles className="mx-auto mb-4 h-8 w-8 text-emerald-500" />
    <h2 className="text-xl font-extrabold">{title}</h2>
    <p className="mt-2 text-sm text-slate-500">
      This demo surface is coming in the next build phase.
    </p>
    <Link to="/" className="mt-5 inline-block text-sm font-bold text-emerald-700">
      Back to Discover →
    </Link>
  </div>
)
