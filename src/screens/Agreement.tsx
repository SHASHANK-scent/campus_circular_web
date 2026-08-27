import { useMemo, useState } from 'react'
import { ArrowLeft, Check, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Badge, money, PageTitle } from '../components/Layout'
import { ResourceImage } from '../components/ResourceImage'
import { calculatePricing } from '../lib/pricing'
import { useApp } from '../store/AppStore'
import type { Exchange } from '../data/types'

const addDays = (value: string, days: number) =>
  new Date(new Date(value).getTime() + days * 24 * 3600000).toISOString()

export const Agreement = () => {
  const { resourceId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const resource = state.resources.find((item) => item.id === resourceId) ?? state.resources[0]
  const owner = state.users.find((user) => user.id === resource.ownerId) ?? state.users[0]
  const borrower = state.users.find((user) => user.id === state.currentUserId) ?? state.users[0]
  const queue = (params.get('queue') ?? resource.id).split(',').filter(Boolean)
  const index = Number(params.get('index') ?? 0)
  const startAt = state.simulatedNow
  const dueAt = addDays(startAt, 1)
  const pricing = calculatePricing({
    resource,
    mode: 'daily',
    units: 1,
    platform: state.config,
  })
  const [agreed, setAgreed] = useState(false)
  const [purpose, setPurpose] = useState('Campus project and community event')
  const nextResourceId = queue[index + 1]
  const exchangeId = useMemo(
    () => `ex-${state.exchanges.length + 1}-${resource.id}`,
    [resource.id, state.exchanges.length],
  )
  const confirm = () => {
    const exchange: Exchange = {
      id: exchangeId,
      resourceId: resource.id,
      ownerId: owner.id,
      borrowerId: borrower.id,
      createdOn: state.simulatedNow,
      status: 'Requested',
      timeline: [{ status: 'Requested', at: state.simulatedNow, note: 'Agreement submitted.' }],
      plan: { mode: 'daily', units: 1, startAt, dueAt },
      charges: {
        borrowFee: pricing.borrowFee,
        platformFee: pricing.platformFee,
        deposit: pricing.deposit,
        lateFee: 0,
        damageDeduction: 0,
      },
      payment: {
        status: 'Pending',
        method: 'Campus Wallet',
        amount: pricing.payableUpfront,
        txnId: `CC-PAY-${exchangeId.replace(/^ex-/, '')}`,
      },
      fines: [],
      purpose,
    }
    dispatch({ type: 'createExchange', exchange })
    if (nextResourceId) {
      navigate(`/agreement/${nextResourceId}?queue=${queue.join(',')}&index=${index + 1}`)
    } else {
      navigate(`/exchanges/${exchange.id}`)
    }
  }
  return (
    <>
      <Link
        to="/need"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" /> Back to your kit
      </Link>
      <PageTitle eyebrow={`Agreement ${index + 1} of ${queue.length}`} title="Borrow with clarity">
        <Badge tone="green">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Protected exchange
        </Badge>
      </PageTitle>
      <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex gap-4">
              <ResourceImage resource={resource} small />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Resource
                </p>
                <h2 className="mt-1 text-xl font-black">{resource.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Owned by {owner.name} · {resource.location}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Borrower
                </p>
                <p className="mt-1 text-sm font-bold">{borrower.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Owner
                </p>
                <p className="mt-1 text-sm font-bold">{owner.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Pickup
                </p>
                <p className="mt-1 text-sm font-bold">
                  {new Date(startAt).toLocaleString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Return deadline
                </p>
                <p className="mt-1 text-sm font-bold">
                  {new Date(dueAt).toLocaleString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Responsibilities</h2>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-600">
              {[
                'Meet at the listed location and verify the handover condition together.',
                'Keep the resource safe, indoors, and with every listed accessory.',
                'Return by the deadline. A 30-minute grace period applies before late fees.',
                'Report any issue immediately so the community can resolve it fairly.',
              ].map((responsibility) => (
                <li key={responsibility}>
                  <Check className="mr-2 inline h-4 w-4 text-emerald-600" />
                  {responsibility}
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs">
                <p className="font-extrabold text-amber-800">Late-fee policy</p>
                <p className="mt-1 leading-5 text-amber-700">
                  ₹{resource.lateFeePerHour}/hour after the 30-minute grace period, capped at your
                  deposit.
                </p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs">
                <p className="font-extrabold text-rose-800">Damage policy</p>
                <p className="mt-1 leading-5 text-rose-700">
                  Verified damage may be deducted from the refundable deposit after inspection.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-xs font-bold text-slate-500">
              What are you borrowing it for?
            </label>
            <input
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <ClipboardCheck className="h-6 w-6 text-emerald-600" />
          <h2 className="mt-3 text-xl font-black">Review your agreement</h2>
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
              <span className="text-slate-500">Security deposit</span>
              <b>{money(pricing.deposit)}</b>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="font-extrabold">Transaction amount</span>
              <b className="text-emerald-700">{money(pricing.payableUpfront)}</b>
            </div>
          </div>
          <p className="text-[11px] leading-5 text-slate-500">
            The deposit is refundable after a clean return. Once the owner accepts, pay this
            agreed amount before handover.
          </p>
          <label className="mt-5 flex gap-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span>I have read and agree to the borrowing responsibilities and policies.</span>
          </label>
          <button
            disabled={!agreed}
            onClick={confirm}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm and request
          </button>
        </aside>
      </div>
    </>
  )
}
