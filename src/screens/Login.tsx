import { Link, useNavigate } from 'react-router-dom'
import { Badge, Avatar, PageTitle } from '../components/Layout'
import { OwnerVerificationBadge } from '../components/VerificationBadge'
import { trustScore } from '../lib/trust'
import { useApp } from '../store/AppStore'

export const Login = () => {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle eyebrow="Campus Circular members" title="Verify your campus identity first" />
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Choose a demo member to sign in. Members who are not fully verified will complete the
        three-step campus check before they can browse or borrow.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {state.users.map((user) => (
          <button
            key={user.id}
            onClick={() => {
              dispatch({ type: 'login', userId: user.id })
              navigate(user.verification.level === 'Fully Verified' ? '/' : '/verify-me')
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={user.avatarInitials} className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <p className="font-black">{user.name}</p>
                <p className="text-xs text-slate-500">{user.department} · {user.year}</p>
              </div>
              <p className="text-lg font-black text-emerald-700">{trustScore(user, state.exchanges)}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <OwnerVerificationBadge user={user} />
              <Badge tone={user.verification.level === 'Fully Verified' ? 'green' : 'amber'}>
                Trust score
              </Badge>
            </div>
          </button>
        ))}
      </div>
      <Link to="/admin/login" className="mt-6 block text-xs font-bold text-slate-500">
        Admin console →
      </Link>
    </div>
  )
}
