import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, BookOpen, CircleUserRound, MapPin, Trophy } from 'lucide-react'
import { Badge, money, PageTitle } from '../components/Layout'
import { formatDate } from '../lib/clock'
import { useApp } from '../store/AppStore'
export const Profile = () => {
  const { id } = useParams()
  const { state } = useApp()
  const user = state.users.find((item) => item.id === id) ?? state.users[0]
  const listed = state.resources.filter(
    (resource) => resource.ownerId === user.id && resource.approvalStatus === 'Approved',
  )
  const exchanges = state.exchanges.filter(
    (exchange) => exchange.ownerId === user.id || exchange.borrowerId === user.id,
  )
  const onTime = Math.round(
    (user.successfulExchanges / Math.max(1, user.successfulExchanges + user.lateReturns)) * 100,
  )
  return (
    <>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back to discover
      </Link>
      <section className="rounded-3xl bg-slate-900 p-7 text-white md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500 text-3xl font-black">
            {user.avatarInitials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black">{user.name}</h1>
              {user.verified && <BadgeCheck className="h-5 w-5 text-emerald-300" />}
            </div>
            <p className="mt-2 text-sm text-slate-300">
              {user.department} · {user.year} · {user.hostel}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {user.distanceMeters ? `${user.distanceMeters}m from you` : 'Your profile'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-4xl font-black text-emerald-300">{user.trustScore}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Trust score
            </p>
          </div>
        </div>
      </section>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Successful exchanges', user.successfulExchanges],
          ['On-time returns', `${onTime}%`],
          ['Late returns', user.lateReturns],
          ['Disputes', user.disputes],
          ['Rating', `★ ${user.rating.toFixed(1)}`],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-4" key={label}>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <PageTitle eyebrow="Community reputation" title="Badges & activity" />
          <div className="flex flex-wrap gap-3">
            {user.badges.map((badge) => (
              <div
                className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800"
                key={badge}
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                {badge}
              </div>
            ))}
          </div>
          <h2 className="mt-9 text-lg font-black">
            Listed resources{' '}
            <span className="text-sm font-normal text-slate-400">({listed.length})</span>
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {listed.slice(0, 6).map((resource) => (
              <Link
                to={`/item/${resource.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-emerald-300"
                key={resource.id}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold">{resource.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {money(resource.dailyCharge)} / day · {resource.condition}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <h2 className="mt-9 text-lg font-black">Recent exchange history</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {exchanges.slice(0, 5).map((exchange) => (
              <div
                className="flex items-center justify-between border-b border-slate-100 px-4 py-4 text-xs last:border-0"
                key={exchange.id}
              >
                <span className="font-bold">
                  {state.resources.find((resource) => resource.id === exchange.resourceId)?.title}
                </span>
                <Badge tone={exchange.status === 'Rated' ? 'green' : 'amber'}>
                  {exchange.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black">Reviews received</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-4xl font-black">{user.rating.toFixed(1)}</span>
            <div>
              <div className="text-amber-500">★★★★★</div>
              <p className="text-[11px] text-slate-500">{user.ratingsCount} community reviews</p>
            </div>
          </div>
          <div className="mt-6 space-y-5 border-t border-slate-100 pt-5">
            <div>
              <p className="text-xs font-bold">“Always clear about pickup and return.”</p>
              <p className="mt-1 text-[11px] text-slate-400">— Priya, Design · 2 weeks ago</p>
            </div>
            <div>
              <p className="text-xs font-bold">“The item was exactly as described.”</p>
              <p className="mt-1 text-[11px] text-slate-400">— Arjun, CSE · last month</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <CircleUserRound className="h-5 w-5 text-emerald-600" />
            <p className="mt-2 text-xs font-bold">Member since {formatDate(user.joinedOn)}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Verified students help keep Campus Circular safe and fair.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
