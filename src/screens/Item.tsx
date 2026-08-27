import { useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, money, PageTitle } from '../components/Layout'
import { ResourceImage } from '../components/ResourceImage'
import { formatDate } from '../lib/clock'
import { calculatePricing } from '../lib/pricing'
import { useApp } from '../store/AppStore'
export const Item = () => {
  const { id } = useParams()
  const { state } = useApp()
  const resource = state.resources.find((item) => item.id === id) ?? state.resources[0]
  const owner = state.users.find((user) => user.id === resource.ownerId) ?? state.users[0]
  const [mode, setMode] = useState<'daily' | 'hourly'>('daily')
  const [units, setUnits] = useState(1)
  const pricing = calculatePricing({ resource, mode, units, platform: state.config })
  const navigate = useNavigate()
  return (
    <>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to discover
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_320px]">
        <div>
          <ResourceImage resource={resource} />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-16 rounded-lg bg-gradient-to-br from-slate-100 to-emerald-50"
              />
            ))}
          </div>
        </div>
        <section>
          <Badge tone="green">{resource.category}</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{resource.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{resource.condition}</Badge>
            <Badge>
              <MapPin className="mr-1 inline h-3 w-3" />
              {resource.location} · {resource.distanceMeters}m
            </Badge>
            <Badge>
              <Star className="mr-1 inline h-3 w-3 text-amber-500" />
              {resource.rating.toFixed(1)} ({resource.timesBorrowed} borrows)
            </Badge>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-600">{resource.description}</p>
          <h2 className="mt-7 text-sm font-extrabold">Included with your borrow</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {resource.accessories.map((accessory) => (
              <span
                key={accessory}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
              >
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                {accessory}
              </span>
            ))}
          </div>
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">About the owner</h2>
              <Link to={`/profile/${owner.id}`} className="text-xs font-bold text-emerald-700">
                View profile →
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                {owner.avatarInitials}
              </span>
              <div>
                <p className="text-sm font-bold">
                  {owner.name}{' '}
                  {owner.verified && (
                    <ShieldCheck className="ml-1 inline h-4 w-4 text-emerald-600" />
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {owner.department} · {owner.year} · Trust {owner.trustScore}
                </p>
              </div>
            </div>
          </div>
          <h2 className="mt-7 text-sm font-extrabold">Borrowing conditions</h2>
          <ul className="mt-3 space-y-2">
            {resource.borrowingConditions.map((condition) => (
              <li key={condition} className="text-xs text-slate-600">
                <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-600" />
                {condition}
              </li>
            ))}
          </ul>
        </section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Request to borrow
          </p>
          <div className="mt-5 flex rounded-xl bg-slate-100 p-1">
            {(['daily', 'hourly'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize ${mode === item ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="mt-5 block text-xs font-bold text-slate-500">Duration</label>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setUnits(Math.max(1, units - 1))}
              className="h-9 w-9 rounded-lg border border-slate-200"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-black">
              {units} {mode === 'daily' ? 'day' : 'hour'}
              {units > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setUnits(units + 1)}
              className="h-9 w-9 rounded-lg border border-slate-200"
            >
              +
            </button>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays className="h-4 w-4 text-emerald-600" /> Available now · next 14 days clear
          </p>
          <div className="mt-5 space-y-3 border-y border-slate-100 py-4 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Borrowing charge</span>
              <b>{money(pricing.borrowFee)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Platform fee</span>
              <b>{money(pricing.platformFee)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Refundable deposit</span>
              <b>{money(pricing.deposit)}</b>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="font-extrabold">Transaction amount</span>
              <b className="text-emerald-700">{money(pricing.payableUpfront)}</b>
            </div>
          </div>
          <button
            onClick={() => navigate(`/agreement/${resource.id}`)}
            className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Request to borrow
          </button>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            Deposit is refundable after a clean return.
          </p>
        </aside>
      </div>
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
        <PageTitle eyebrow="Availability" title="Plan around campus schedules" />
        <div className="grid grid-cols-7 gap-2 md:grid-cols-14">
          {Array.from({ length: 14 }, (_, index) => (
            <div
              className={`rounded-lg border p-2 text-center ${index === 4 ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}
              key={index}
            >
              <p className="text-[10px] font-bold text-slate-400">
                {new Date(
                  new Date(state.simulatedNow).getTime() + index * 86400000,
                ).toLocaleDateString('en-IN', { weekday: 'short' })}
              </p>
              <p className="mt-1 text-sm font-black">
                {new Date(new Date(state.simulatedNow).getTime() + index * 86400000).getDate()}
              </p>
              <p
                className={`mt-1 text-[9px] font-bold ${index === 4 ? 'text-amber-700' : 'text-emerald-600'}`}
              >
                {index === 4 ? 'Blocked' : 'Free'}
              </p>
            </div>
          ))}
        </div>
        <h2 className="mt-7 text-sm font-extrabold">Previous usage</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {resource.history.length ? (
            resource.history.map((entry) => (
              <div
                key={entry.exchangeId}
                className="flex items-center justify-between py-3 text-xs"
              >
                <span className="font-bold">
                  {state.users.find((user) => user.id === entry.borrowerId)?.avatarInitials ?? '—'}{' '}
                  <span className="font-normal text-slate-500">· {formatDate(entry.endedOn)}</span>
                </span>
                <span className={entry.onTime ? 'text-emerald-700' : 'text-amber-700'}>
                  {entry.onTime ? '✓ Returned on time' : 'Late return'}
                </span>
                <span className="hidden text-slate-500 sm:block">{entry.note}</span>
              </div>
            ))
          ) : (
            <p className="py-3 text-xs text-slate-500">No previous usage recorded.</p>
          )}
        </div>
      </div>
    </>
  )
}
