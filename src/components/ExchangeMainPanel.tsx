import { useState, type Dispatch } from 'react'
import { AlertTriangle, CreditCard, FileWarning, Star } from 'lucide-react'
import type { Exchange, FineReason, Payment, PlatformConfig, Rating, Resource, ReviewTag } from '../data/types'
import { formatDate, formatRelative } from '../lib/clock'
import { canTransition, roleFor, settlementForExchange } from '../lib/lifecycle'
import { imageToDataUrl } from '../lib/photos'
import type { Action } from '../store/AppStore'
import { Badge, money } from './Layout'
import { ConditionForm } from './ConditionForm'
import { SettlementBreakdown } from './SettlementBreakdown'

const ReportDamage = ({
  onSubmit,
}: {
  onSubmit: (amount: number, description: string, evidence: string[]) => void
}) => {
  const [amount, setAmount] = useState(100)
  const [description, setDescription] = useState('Small scratch found during inspection.')
  const [evidence, setEvidence] = useState<string[]>([])
  const [error, setError] = useState('')
  const addEvidence = async (file: File) => {
    try {
      const photo = await imageToDataUrl(file)
      setEvidence((current) => [...current, photo].slice(0, 3))
      setError('')
    } catch {
      setError('That image could not be processed.')
    }
  }
  return (
    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <p className="text-sm font-black text-rose-800">Report damage</p>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        className="mt-3 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs"
        placeholder="Claimed amount"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="mt-2 min-h-20 w-full rounded-lg border border-rose-200 bg-white p-3 text-xs"
      />
      <label className="mt-2 block cursor-pointer rounded-lg border border-dashed border-rose-300 bg-white p-3 text-xs font-bold text-rose-700">
        Add evidence photos
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            void Promise.all(Array.from(event.target.files ?? []).map(addEvidence))
          }}
          className="hidden"
        />
      </label>
      {evidence.length > 0 && (
        <p className="mt-2 text-[11px] text-rose-700">{evidence.length} evidence photo(s) ready</p>
      )}
      {error && <p className="mt-2 text-[11px] text-rose-600">{error}</p>}
      <button
        onClick={() => onSubmit(amount, description, evidence)}
        className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white"
      >
        Submit damage report
      </button>
    </div>
  )
}

const RatingForm = ({ onSubmit, now, owner, exchange }: { onSubmit: (rating: Rating) => void; now: string; owner: boolean; exchange: Exchange }) => {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('Reliable and easy to coordinate with.')
  const initialTags: ReviewTag[] = owner
    ? [
        ...(exchange.returnedAt && new Date(exchange.returnedAt).getTime() > new Date(exchange.plan.dueAt).getTime() ? ['Returned late' as const] : ['Returned on time' as const]),
        ...(exchange.after && exchange.before && ['Like New', 'Good', 'Fair', 'Worn'].indexOf(exchange.after.overall) > ['Like New', 'Good', 'Fair', 'Worn'].indexOf(exchange.before.overall) ? ['Returned damaged' as const] : ['Came back in good condition' as const]),
      ]
    : ['Great communication' as const]
  const [tags, setTags] = useState<ReviewTag[]>(initialTags)
  const [condition, setCondition] = useState<Rating['conditionOnReturn']>(exchange.after?.overall)
  const availableTags: ReviewTag[] = owner
    ? ['Returned on time', 'Returned late', 'Came back in good condition', 'Returned damaged', 'Missing accessories', 'Poor care']
    : ['Great communication', 'Poor care']
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-600">Leave a rating</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => setStars(value)}
            className={value <= stars ? 'text-amber-500' : 'text-slate-300'}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <button key={tag} onClick={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} className={`rounded-full px-2 py-1 text-[10px] font-bold ${tags.includes(tag) ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500'}`}>{tag}</button>
        ))}
      </div>
      {owner && (
        <select value={condition ?? ''} onChange={(event) => setCondition(event.target.value as Rating['conditionOnReturn'])} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
          <option value="">Returned condition</option>
          {(['Like New', 'Good', 'Fair', 'Worn'] as const).map((item) => <option key={item}>{item}</option>)}
        </select>
      )}
      <button
        onClick={() => onSubmit({ stars, comment, at: now, tags, ...(condition ? { conditionOnReturn: condition } : {}) })}
        className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
      >
        Submit rating
      </button>
    </div>
  )
}

const FineForm = ({ exchange, dispatch }: { exchange: Exchange; dispatch: Dispatch<Action> }) => {
  const [reason, setReason] = useState<FineReason>('Damage')
  const [amount, setAmount] = useState(100)
  const [note, setNote] = useState('')
  return <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <p className="text-xs font-black text-amber-800">Issue a fine</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <select value={reason} onChange={(event) => setReason(event.target.value as FineReason)} className="field">{['Damage', 'Missing accessories', 'Lost item'].map((item) => <option key={item}>{item}</option>)}</select>
      <input type="number" min="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="field" />
      <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note" className="field" />
    </div>
    <button onClick={() => dispatch({ type: 'issueFine', exchangeId: exchange.id, reason, amount, note: note || undefined })} className="mt-3 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">Issue fine</button>
  </div>
}

const PaymentPanel = ({
  exchange,
  dispatch,
}: {
  exchange: Exchange
  dispatch: Dispatch<Action>
}) => {
  const [method, setMethod] = useState<Payment['method']>(exchange.payment.method)
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 text-emerald-700" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Payment required
          </p>
          <h2 className="mt-1 text-xl font-black">Secure this borrowing request</h2>
          <p className="mt-2 text-xs text-slate-600">
            The owner accepted your request. Pay the agreed amount before handover.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3 rounded-xl bg-white p-4 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Borrowing charge</span>
          <b>{money(exchange.charges.borrowFee)}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Platform fee</span>
          <b>{money(exchange.charges.platformFee)}</b>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3">
          <span className="font-bold">Refundable deposit</span>
          <b className="text-emerald-700">{money(exchange.charges.deposit)}</b>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
          <span className="font-black">Transaction amount</span>
          <b className="text-emerald-700">{money(exchange.payment.amount)}</b>
        </div>
      </div>
      <label className="mt-4 block text-xs font-bold text-slate-600">
        Payment method
        <select
          value={method}
          onChange={(event) => setMethod(event.target.value as Payment['method'])}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs"
        >
          <option>Campus Wallet</option>
          <option>UPI (simulated)</option>
        </select>
      </label>
      <button
        onClick={() => dispatch({ type: 'payExchange', exchangeId: exchange.id, method })}
        className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700"
      >
        Pay {money(exchange.payment.amount)}
      </button>
    </div>
  )
}

const PaymentReceipt = ({ payment }: { payment: Payment }) => (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Payment receipt</p>
    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
      <div>
        <p className="text-slate-500">Method</p>
        <p className="mt-1 font-bold">{payment.method}</p>
      </div>
      <div>
        <p className="text-slate-500">Transaction ID</p>
        <p className="mt-1 font-bold">{payment.txnId}</p>
      </div>
      <div>
        <p className="text-slate-500">Paid at</p>
        <p className="mt-1 font-bold">{payment.paidAt ? formatDate(payment.paidAt) : '—'}</p>
      </div>
    </div>
    {payment.refund && (
      <div className="mt-4 rounded-xl bg-white p-4 text-xs">
        <p className="font-black text-emerald-800">Deposit refund receipt</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <span>Refunded {money(payment.refund.amount)}</span>
          <span>{payment.refund.txnId}</span>
          <span>{formatDate(payment.refund.at)}</span>
        </div>
      </div>
    )}
    {payment.outstanding && (
      <div className="mt-4 rounded-xl bg-rose-50 p-4 text-xs">
        <p className="font-black text-rose-800">Outstanding fine payment</p>
        <p className="mt-2">₹{Math.round(payment.outstanding.amount).toLocaleString('en-IN')} · {payment.outstanding.status}</p>
        {payment.outstanding.txnId && <p className="mt-1 text-slate-500">{payment.outstanding.txnId}</p>}
      </div>
    )}
  </div>
)

export const ExchangeMainPanel = ({
  exchange,
  resource,
  config,
  role,
  now,
  dispatch,
}: {
  exchange: Exchange
  resource: Resource
  config: PlatformConfig
  role: ReturnType<typeof roleFor>
  now: string
  dispatch: Dispatch<Action>
}) => {
  const [showDamage, setShowDamage] = useState(false)
  const transition = (status: Exchange['status'], note?: string) => {
    if (role && canTransition(exchange, status, role)) {
      dispatch({ type: 'transition', exchangeId: exchange.id, status, note })
    }
  }
  const pricing = settlementForExchange(exchange, resource, config, now)
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Exchange {exchange.id}
            </p>
            <h2 className="mt-2 text-xl font-black">
              {exchange.purpose ?? 'Campus resource exchange'}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              {formatDate(exchange.plan.startAt)} → {formatDate(exchange.plan.dueAt)} ·{' '}
              {role === 'owner' ? 'You are lending' : 'You are borrowing'}
            </p>
          </div>
          {exchange.status === 'Return Due' && <AlertTriangle className="h-6 w-6 text-rose-500" />}
        </div>
        {exchange.status === 'Borrowed' || exchange.status === 'Return Due' ? (
          <div
            className={`mt-5 flex items-center gap-3 rounded-xl p-4 text-sm font-black ${
              exchange.status === 'Return Due'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            {exchange.status === 'Return Due'
              ? `${formatRelative(exchange.plan.dueAt, now)} · ${money(pricing.lateFee)} late fee`
              : `Return ${formatRelative(exchange.plan.dueAt, now)}`}
          </div>
        ) : null}
      </div>
      {exchange.status === 'Accepted' &&
        role === 'borrower' &&
        exchange.payment.status === 'Pending' && (
          <PaymentPanel exchange={exchange} dispatch={dispatch} />
        )}
      {(exchange.payment.status === 'Paid' || exchange.payment.status === 'Refunded') && (
        <PaymentReceipt payment={exchange.payment} />
      )}
      {exchange.status === 'Accepted' && role === 'owner' && (
        <>
          <ConditionForm
            heading="Record handover condition"
            onSave={(report) => dispatch({ type: 'condition', exchangeId: exchange.id, report, side: 'before' })}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Handover
            </p>
            {exchange.payment.status === 'Pending' ? (
              <>
                <h2 className="mt-2 text-lg font-black">Waiting for borrower payment</h2>
                <p className="mt-2 text-xs text-slate-500">
                  Handover can start after the borrower pays the agreed transaction amount.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Confirm handover after both people have checked the condition.
              </p>
            )}
            <button
              disabled={exchange.payment.status === 'Pending' || !exchange.before}
              onClick={() => transition('Handover', 'Handover condition recorded.')}
              className="mt-4 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm handover
            </button>
          </div>
        </>
      )}
      {exchange.status === 'Handover' && role === 'owner' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Handover ready
          </p>
          <h2 className="mt-2 text-xl font-black">Has the resource changed hands?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Both people have checked the condition. Confirm the handover to start the borrowing
            window.
          </p>
          <button
            onClick={() => transition('Borrowed', 'Resource handed over.')}
            className="mt-5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white"
          >
            Confirm handover
          </button>
        </div>
      )}
      {exchange.status === 'Returned' && role === 'owner' && (
        <ConditionForm
          heading="Inspect returned resource"
          onSave={(report) => {
            dispatch({ type: 'condition', exchangeId: exchange.id, report, side: 'after' })
            transition('Inspection', 'Return inspection recorded.')
          }}
        />
      )}
      {exchange.status === 'Inspection' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Inspection
              </p>
              <h2 className="mt-1 text-xl font-black">Compare before and after</h2>
            </div>
            <FileWarning className="h-6 w-6 text-amber-500" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Before handover', report: exchange.before },
              { label: 'After return', report: exchange.after },
            ].map(({ label, report }) => (
              <div className="rounded-xl bg-slate-50 p-4" key={label}>
                <p className="text-xs font-bold">{label}</p>
                <p className="mt-2 text-sm font-black">{report?.overall ?? 'Not recorded'}</p>
                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  {(report?.checklist ?? []).map((check) => (
                    <p key={check.label} className={check.ok ? '' : 'font-bold text-rose-600'}>
                      {check.ok ? '✓' : '×'} {check.label}
                    </p>
                  ))}
                </div>
                {report?.photos && report.photos.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {report.photos.map((photo, photoIndex) => (
                      <img
                        key={`${label}-${photoIndex}`}
                        src={photo}
                        alt={`${label} condition ${photoIndex + 1}`}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {role === 'owner' && (
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => transition('Settlement', 'No damage reported.')}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white"
              >
                No issues
              </button>
              <button
                onClick={() => setShowDamage(!showDamage)}
                className="rounded-xl border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700"
              >
                Report damage
              </button>
            </div>
          )}
          {showDamage && role === 'owner' && (
            <ReportDamage
              onSubmit={(amount, description, evidence) => {
                dispatch({
                  type: 'damage',
                  exchangeId: exchange.id,
                  claimedAmount: amount,
                  description,
                  evidence,
                })
                transition('Settlement', 'Damage report submitted for settlement.')
                setShowDamage(false)
              }}
            />
          )}
          {role === 'owner' && <FineForm exchange={exchange} dispatch={dispatch} />}
          {exchange.dispute && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs">
              <p className="font-black text-rose-800">Damage dispute · {exchange.dispute.status}</p>
              <p className="mt-2 text-rose-700">{exchange.dispute.description}</p>
              <p className="mt-2 font-bold text-rose-800">
                Claimed: {money(exchange.dispute.claimedAmount)}
              </p>
              {exchange.dispute.evidence.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {exchange.dispute.evidence.map((photo, photoIndex) => (
                    <img
                      key={`evidence-${photoIndex}`}
                      src={photo}
                      alt={`Damage evidence ${photoIndex + 1}`}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {(exchange.status === 'Settlement' || exchange.status === 'Rated') && (
        <SettlementBreakdown exchange={exchange} resource={resource} config={config} now={now} />
      )}
      {(exchange.status === 'Settlement' || exchange.status === 'Rated') && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Close the loop</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {role === 'owner' && !exchange.ratingByOwner ? (
              <RatingForm
                now={now}
                owner
                exchange={exchange}
                onSubmit={(rating) =>
                  dispatch({ type: 'rating', exchangeId: exchange.id, side: 'owner', rating })
                }
              />
            ) : (
              <Badge tone="green">
                Owner rating: {exchange.ratingByOwner?.stars ?? 'Pending'} ★
              </Badge>
            )}
            {role === 'borrower' && !exchange.ratingByBorrower ? (
              <RatingForm
                now={now}
                owner={false}
                exchange={exchange}
                onSubmit={(rating) =>
                  dispatch({ type: 'rating', exchangeId: exchange.id, side: 'borrower', rating })
                }
              />
            ) : (
              <Badge tone="green">
                Borrower rating: {exchange.ratingByBorrower?.stars ?? 'Pending'} ★
              </Badge>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
