import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CircleUserRound,
  MapPin,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Badge, money, PageTitle } from '../components/Layout'
import { OwnerVerificationBadge, VerificationBadge } from '../components/VerificationBadge'
import { ResourceImage } from '../components/ResourceImage'
import { formatDate } from '../lib/clock'
import { isPubliclyListed, ownerVerificationLevel } from '../lib/verification'
import { useApp } from '../store/AppStore'
import { avgRating, liveReviews, trustBreakdown, trustScore } from '../lib/trust'
export const Profile = () => {
  const { id } = useParams()
  const { state } = useApp()
  const user = state.users.find((item) => item.id === id) ?? state.users[0]
  const listed = state.resources.filter(
    (resource) => resource.ownerId === user.id && !resource.removed,
  )
  const verifiedListings = listed.filter(isPubliclyListed)
  const level = ownerVerificationLevel(user.verification)
  const ownerChecks: [string, boolean][] = [
    ['College ID card checked', user.verification.identityVerified],
    ['Enrolment and department confirmed', user.verification.campusVerified],
    ['Phone and email confirmed', user.verification.contactVerified],
  ]
  const exchanges = state.exchanges.filter(
    (exchange) => exchange.ownerId === user.id || exchange.borrowerId === user.id,
  )
  const reviews = liveReviews(user, state.exchanges)
    .map((rating) => {
      const exchange = state.exchanges.find(
        (item) => item.ratingByOwner === rating || item.ratingByBorrower === rating,
      )
      return { rating, exchange }
    })
    .sort((a, b) => new Date(b.rating.at).getTime() - new Date(a.rating.at).getTime())
  const ratingAverage = avgRating(user, state.exchanges)
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating.stars === stars).length,
  }))
  const breakdown = trustBreakdown(user, state.exchanges)
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
              <span className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                {level}
              </span>
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
            <p className="text-4xl font-black text-emerald-300">{trustScore(user, state.exchanges)}</p>
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
          ['Rating', `★ ${ratingAverage.toFixed(1)}`],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-4" key={label}>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
        <PageTitle eyebrow="Trust evidence" title="How this member was verified" />
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <OwnerVerificationBadge user={user} />
            <ul className="mt-4 space-y-2">
              {ownerChecks.map(([label, done]) => (
                <li className="flex items-center gap-2 text-xs text-slate-600" key={label}>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  )}
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-500">
              {user.verification.verifiedAt
                ? `Verified on ${formatDate(user.verification.verifiedAt)}`
                : 'No campus verification on record yet.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Verified listings', `${verifiedListings.length} of ${listed.length}`],
              ['Successful exchanges', user.successfulExchanges],
              ['Late returns', user.lateReturns],
              ['Disputes', user.disputes],
            ].map(([label, value]) => (
              <div className="rounded-xl bg-slate-50 p-4" key={label}>
                <p className="text-lg font-black">{value}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
        <PageTitle eyebrow="Reviews" title="Community feedback" />
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div>
            <p className="text-4xl font-black">{ratingAverage.toFixed(1)}</p>
            <p className="mt-1 text-amber-500">★★★★★</p>
            <p className="mt-1 text-xs text-slate-500">{reviews.length} live review(s) · {user.ratingsCount} historical</p>
            <div className="mt-4 space-y-1">
              {distribution.map((item) => <div className="flex items-center gap-2 text-[11px]" key={item.stars}><span className="w-5">{item.stars}★</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${Math.min(100, item.count * 20)}%` }} /></div><span className="w-4 text-right text-slate-500">{item.count}</span></div>)}
            </div>
          </div>
          <div className="space-y-3">
            {reviews.length === 0 ? <p className="text-sm text-slate-500">No exchange reviews have been posted yet.</p> : reviews.map(({ rating, exchange }) => {
              const receivedAsBorrower = exchange?.borrowerId === user.id
              const otherId = receivedAsBorrower ? exchange?.ownerId : exchange?.borrowerId
              const other = state.users.find((item) => item.id === otherId)
              const resource = state.resources.find((item) => item.id === exchange?.resourceId)
              return <div className="rounded-xl bg-slate-50 p-4" key={`${rating.at}-${rating.comment}`}><div className="flex justify-between gap-3"><span className="text-amber-500">{'★'.repeat(rating.stars)}<span className="text-slate-300">{'★'.repeat(5 - rating.stars)}</span></span><span className="text-[11px] text-slate-400">{formatDate(rating.at)}</span></div><p className="mt-2 text-xs font-bold">“{rating.comment}”</p><p className="mt-1 text-[11px] text-slate-500">{resource?.title ?? 'Exchange'} · with {other?.name ?? 'campus member'} · received as {receivedAsBorrower ? 'borrower' : 'owner'}</p><div className="mt-2 flex flex-wrap gap-1">{(rating.tags ?? []).map((tag) => <Badge key={tag} tone={tag === 'Returned damaged' || tag === 'Poor care' ? 'rose' : 'green'}>{tag}</Badge>)}</div></div>
            })}
          </div>
        </div>
      </section>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-black">How this score is calculated</h2>
        <p className="mt-1 text-xs text-slate-500">Live score updates as reviews and exchange outcomes are recorded.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Base', `+${breakdown.base}`],
            ['Ratings', `+${breakdown.ratings.toFixed(1)}`],
            ['Exchanges', `+${breakdown.exchanges}`],
            ['Late-return penalty', `−${breakdown.lateReturnPenalty}`],
            ['Dispute penalty', `−${breakdown.disputePenalty}`],
          ].map(([label, value]) => <div className="rounded-xl bg-slate-50 p-3" key={label}><p className="text-sm font-black">{value}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{label}</p></div>)}
        </div>
      </section>
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
                <ResourceImage resource={resource} small />
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold">{resource.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {money(resource.dailyCharge)} / day · {resource.condition}
                  </p>
                  <div className="mt-2">
                    <VerificationBadge resource={resource} />
                  </div>
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
            <span className="text-4xl font-black">{ratingAverage.toFixed(1)}</span>
            <div>
              <div className="text-amber-500">★★★★★</div>
              <p className="text-[11px] text-slate-500">{user.ratingsCount + reviews.length} community reviews</p>
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
