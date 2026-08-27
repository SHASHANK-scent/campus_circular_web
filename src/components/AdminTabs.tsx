import { useMemo, useState } from 'react'
import { BadgeCheck, Flag, ScanSearch, ShieldAlert, Trash2, UserCheck, X } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Condition, EquipmentCheck, Resource } from '../data/types'
import { aggregateImpact } from '../lib/impact'
import { pendingVerificationCount, STANDARD_CHECKS } from '../lib/verification'
import { formatDate } from '../lib/clock'
import { Badge, money } from './Layout'
import { useApp } from '../store/AppStore'
import { VerificationBadge } from './VerificationBadge'
import { trustScore } from '../lib/trust'
import { ledgerRows, ledgerSummary } from '../lib/ledger'

type Tab =
  | 'Overview'
  | 'Verification'
  | 'Handover & Returns'
  | 'Users'
  | 'Resources'
  | 'Exchanges'
  | 'Disputes'
  | 'Settings'
const conditions: Condition[] = ['Like New', 'Good', 'Fair', 'Worn']

export const AdminTabs = () => {
  const [tab, setTab] = useState<Tab>('Overview')
  const { state, dispatch } = useApp()
  const [exchangeFilter, setExchangeFilter] = useState('All')
  const [feePercent, setFeePercent] = useState(state.config.platformFeePercent)
  const [feeMin, setFeeMin] = useState(state.config.platformFeeMin)
  const [feeMax, setFeeMax] = useState(state.config.platformFeeMax)
  const [grace, setGrace] = useState(state.config.gracePeriodMinutes)
  const [fineCapMultiplier, setFineCapMultiplier] = useState(state.config.fineCapMultiplier)
  const revenue = state.exchanges
    .filter(
      (exchange) => exchange.payment.status === 'Paid' || exchange.payment.status === 'Refunded',
    )
    .reduce((sum, exchange) => sum + exchange.charges.platformFee, 0)
  const pendingPayments = state.exchanges.filter(
    (exchange) => exchange.payment.status === 'Pending',
  ).length
  const impact = aggregateImpact(state)
  const awaitingInspection = pendingVerificationCount(state.resources)
  const filteredExchanges = useMemo(
    () =>
      state.exchanges.filter(
        (exchange) => exchangeFilter === 'All' || exchange.status === exchangeFilter,
      ),
    [exchangeFilter, state.exchanges],
  )
  return (
    <div>
      <div className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {(
          [
            'Overview',
            'Verification',
            'Handover & Returns',
            'Users',
            'Resources',
            'Exchanges',
            'Disputes',
            'Settings',
          ] as Tab[]
        ).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold ${tab === item ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {item}
            {item === 'Verification' && awaitingInspection > 0 && (
              <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                {awaitingInspection}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === 'Overview' && (
        <Overview
          revenue={revenue}
          pendingPayments={pendingPayments}
          state={state}
          revenueOverTime={impact.feeRevenueOverTime}
        />
      )}
      {tab === 'Verification' && <VerificationPanel />}
      {tab === 'Handover & Returns' && <LedgerPanel />}
      {tab === 'Users' && <UsersPanel />}
      {tab === 'Resources' && <ResourcesPanel />}
      {tab === 'Exchanges' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Exchange monitor</h2>
            <select
              value={exchangeFilter}
              onChange={(event) => setExchangeFilter(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            >
              <option>All</option>
              {[
                'Requested',
                'Accepted',
                'Borrowed',
                'Return Due',
                'Inspection',
                'Settlement',
                'Rated',
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 space-y-2">
            {filteredExchanges.map((exchange) => (
              <div
                className={`flex items-center gap-3 rounded-xl p-3 text-xs ${exchange.status === 'Return Due' ? 'bg-rose-50' : 'bg-slate-50'}`}
                key={exchange.id}
              >
                <span className="font-bold">{exchange.id}</span>
                <span className="flex-1">
                  {state.resources.find((resource) => resource.id === exchange.resourceId)?.title}
                </span>
                <Badge tone={exchange.status === 'Return Due' ? 'rose' : 'amber'}>
                  {exchange.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'Disputes' && <DisputesPanel />}
      {tab === 'Settings' && (
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Platform settings</h2>
          <p className="mt-2 text-xs text-slate-500">
            New agreements use these values immediately. Existing settled charges stay unchanged.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['Fee percent', feePercent, setFeePercent],
              ['Minimum fee', feeMin, setFeeMin],
              ['Maximum fee', feeMax, setFeeMax],
              ['Grace period (minutes)', grace, setGrace],
              ['Fine cap multiplier', fineCapMultiplier, setFineCapMultiplier],
            ].map(([label, value, setter]) => (
              <label className="text-xs font-bold text-slate-600" key={label as string}>
                {label as string}
                <input
                  type="number"
                  min="0"
                  value={value as number}
                  onChange={(event) =>
                    (setter as (value: number) => void)(Number(event.target.value))
                  }
                  className="field"
                />
              </label>
            ))}
          </div>
          <button
            onClick={() =>
              dispatch({
                type: 'updateConfig',
                config: {
                  platformFeePercent: feePercent,
                  platformFeeMin: feeMin,
                  platformFeeMax: feeMax,
                  gracePeriodMinutes: grace,
                  fineCapMultiplier,
                },
              })
            }
            className="mt-5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white"
          >
            Save settings
          </button>
        </div>
      )}
    </div>
  )

  function UsersPanel() {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Trust</th>
                <th className="p-4">Disputes</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((user) => (
                <tr className="border-t border-slate-100" key={user.id}>
                  <td className="p-4 font-bold">
                    {user.name}
                    <span className="block text-[10px] font-normal text-slate-400">
                      {user.department}
                    </span>
                  </td>
                  <td className="p-4">
                    {trustScore(user, state.exchanges, state.config.gracePeriodMinutes)}
                  </td>
                  <td className="p-4">{user.disputes}</td>
                  <td className="p-4">
                    {user.suspended ? (
                      <Badge tone="rose">Suspended</Badge>
                    ) : user.flagged ? (
                      <Badge tone="amber">Flagged</Badge>
                    ) : (
                      <Badge tone="green">Active</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button
                        title="Verify"
                        onClick={() =>
                          dispatch({ type: 'adminUser', userId: user.id, action: 'verify' })
                        }
                        className="rounded-lg bg-emerald-50 p-2 text-emerald-700"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Suspend"
                        onClick={() =>
                          dispatch({ type: 'adminUser', userId: user.id, action: 'suspend' })
                        }
                        className="rounded-lg bg-amber-50 p-2 text-amber-700"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Flag"
                        onClick={() =>
                          dispatch({ type: 'adminUser', userId: user.id, action: 'flag' })
                        }
                        className="rounded-lg bg-rose-50 p-2 text-rose-700"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function ResourcesPanel() {
    return (
      <div className="space-y-3">
        {state.resources
          .filter(
            (resource) =>
              resource.approvalStatus === 'Pending' || resource.flagged || resource.removed,
          )
          .map((resource) => (
            <div
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              key={resource.id}
            >
              <div className="flex-1">
                <p className="text-sm font-black">{resource.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {resource.category} · {resource.approvalStatus} ·{' '}
                  {resource.verification.status}
                </p>
                <div className="mt-2">
                  <VerificationBadge resource={resource} />
                </div>
              </div>
              <div className="flex gap-2">
                {resource.verification.status !== 'Verified' && (
                  <button
                    onClick={() => setTab('Verification')}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white"
                  >
                    Inspect in Verification
                  </button>
                )}
                <button
                  onClick={() =>
                    dispatch({ type: 'adminResource', resourceId: resource.id, action: 'flag' })
                  }
                  className="rounded-lg bg-amber-50 p-2 text-amber-700"
                >
                  <Flag className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    dispatch({ type: 'adminResource', resourceId: resource.id, action: 'remove' })
                  }
                  className="rounded-lg bg-rose-50 p-2 text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
      </div>
    )
  }

  function VerificationPanel() {
    const queue = state.resources.filter(
      (resource) => resource.verification.status !== 'Verified' && !resource.removed,
    )
    const verified = state.resources.filter(
      (resource) => resource.verification.status === 'Verified',
    ).length
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Awaiting inspection', awaitingInspection],
            ['Verified equipment', verified],
            [
              'Rejected',
              state.resources.filter((resource) => resource.verification.status === 'Rejected')
                .length,
            ],
          ].map(([label, value]) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={label as string}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {label as string}
              </p>
              <p className="mt-3 text-3xl font-black">{value as number}</p>
            </div>
          ))}
        </div>
        {queue.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 shadow-sm">
            Every listed resource has passed its campus equipment check.
          </p>
        ) : (
          queue.map((resource) => <VerificationRow resource={resource} key={resource.id} />)
        )}
      </div>
    )
  }

  function VerificationRow({ resource }: { resource: Resource }) {
    const [checks, setChecks] = useState<EquipmentCheck[]>(
      resource.verification.checks.length
        ? resource.verification.checks
        : STANDARD_CHECKS.map((label) => ({ label, passed: false })),
    )
    const [condition, setCondition] = useState<Condition>(
      resource.verification.verifiedCondition ?? resource.condition,
    )
    const [note, setNote] = useState(resource.verification.note ?? '')
    const owner = state.users.find((user) => user.id === resource.ownerId)
    const allPassed = checks.every((check) => check.passed)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black">{resource.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {resource.category} · Listed by {owner?.name ?? resource.ownerId} · Submitted{' '}
              {formatDate(resource.verification.submittedAt)}
            </p>
          </div>
          <Badge
            tone={
              resource.verification.status === 'Rejected'
                ? 'rose'
                : resource.verification.status === 'Under Inspection'
                  ? 'amber'
                  : 'slate'
            }
          >
            {resource.verification.status}
          </Badge>
        </div>
        {resource.verification.status === 'Submitted' && (
          <button
            onClick={() => dispatch({ type: 'startInspection', resourceId: resource.id })}
            className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
          >
            <ScanSearch className="mr-1 inline h-3.5 w-3.5" /> Start inspection
          </button>
        )}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {checks.map((check, index) => (
            <label
              className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
              key={check.label}
            >
              <input
                type="checkbox"
                checked={check.passed}
                onChange={(event) =>
                  setChecks(
                    checks.map((item, position) =>
                      position === index ? { ...item, passed: event.target.checked } : item,
                    ),
                  )
                }
                className="accent-emerald-600"
              />
              {check.label}
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value as Condition)}
            className="field"
          >
            {conditions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="field"
            placeholder="Inspection note"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            disabled={!allPassed}
            onClick={() =>
              dispatch({
                type: 'verifyResource',
                resourceId: resource.id,
                checks,
                verifiedCondition: condition,
                note: note || undefined,
              })
            }
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <BadgeCheck className="mr-1 inline h-3.5 w-3.5" /> Verify and publish
          </button>
          <button
            onClick={() =>
              dispatch({
                type: 'rejectResource',
                resourceId: resource.id,
                note: note || 'Equipment did not pass the campus check.',
                checks,
              })
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
          >
            <X className="mr-1 inline h-3.5 w-3.5" /> Reject
          </button>
          {!allPassed && (
            <span className="text-[11px] text-slate-500">
              Every check must pass before an item can be published.
            </span>
          )}
        </div>
      </div>
    )
  }

  function DisputesPanel() {
    return (
      <div className="space-y-4">
        {state.exchanges
          .filter((exchange) => exchange.dispute)
          .map((exchange) => (
            <DisputeRow exchange={exchange} key={exchange.id} />
          ))}
      </div>
    )
  }

  function LedgerPanel() {
    const rows = ledgerRows(state)
    const summary = ledgerSummary(state)
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Currently out', summary.currentlyOut],
            ['Overdue now', summary.overdueNow],
            ['Returned on time', summary.returnedOnTime],
            ['Returned late', summary.returnedLate],
            ['Fines issued', money(summary.finesIssued)],
            ['Fines collected', money(summary.finesCollected)],
          ].map(([label, value]) => (
            <div className="rounded-2xl border border-slate-200 bg-white p-4" key={label as string}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label as string}</p>
              <p className="mt-2 text-2xl font-black">{value as string | number}</p>
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.exchange.id} className={`rounded-2xl border p-5 ${row.overdue ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex flex-wrap justify-between gap-2">
              <div><p className="font-black">{row.title}</p><p className="mt-1 text-xs text-slate-500">{row.owner} → {row.borrower}</p></div>
              <Badge tone={row.overdue || row.lateByHours > 0 ? 'rose' : 'green'}>{row.stillOut ? (row.overdue ? `Still out · ${row.lateByHours}h overdue` : 'Still out') : row.lateByHours ? `${row.lateByHours}h late` : 'Returned on time'}</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
              <span>Handed over {formatDate(row.handedOverAt)}</span><span>Due {formatDate(row.dueAt)}</span><span>Returned {row.returnedAt ? formatDate(row.returnedAt) : 'still out'}</span><span>Condition {row.conditionBefore ?? '—'} → {row.conditionAfter ?? '—'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {row.fines.map((fine) => <span className="inline-flex items-center gap-1" key={fine.id}><Badge tone={fine.status === 'Waived' ? 'slate' : 'amber'}>{fine.reason} {money(fine.amount)} · {fine.status}</Badge>{fine.status !== 'Waived' && row.exchange.payment.status !== 'Refunded' && <button onClick={() => dispatch({ type: 'waiveFine', exchangeId: row.exchange.id, fineId: fine.id })} className="rounded bg-slate-100 px-1.5 py-1 text-[10px] font-bold text-slate-600">Waive</button>}{fine.status === 'Settled' && row.exchange.payment.status === 'Refunded' && <span className="text-[10px] text-slate-400">Settlement locked</span>}</span>)}
              <Badge tone="green">Deposit refunded {money(row.refunded)}</Badge>
              {row.outstanding > 0 && <Badge tone="rose">Outstanding {money(row.outstanding)}</Badge>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  function DisputeRow({ exchange }: { exchange: (typeof state.exchanges)[number] }) {
    const [deduction, setDeduction] = useState(
      exchange.charges.damageDeduction || exchange.dispute?.claimedAmount || 0,
    )
    const [resolution, setResolution] = useState(exchange.dispute?.resolution ?? '')
    if (!exchange.dispute) return null
    const resource = state.resources.find((item) => item.id === exchange.resourceId)
    const owner = state.users.find((user) => user.id === exchange.ownerId)
    const borrower = state.users.find((user) => user.id === exchange.borrowerId)
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600" />
          <div className="flex-1">
            <div className="flex justify-between gap-3">
              <h2 className="font-black">
                {resource?.title ?? exchange.resourceId} · {exchange.dispute.type}
              </h2>
              <Badge tone={exchange.dispute.status === 'Open' ? 'rose' : 'green'}>
                {exchange.dispute.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-600">{exchange.dispute.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              Owner: <strong>{owner?.name ?? exchange.ownerId}</strong> · Borrower:{' '}
              <strong>{borrower?.name ?? exchange.borrowerId}</strong>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Exchange: {formatDate(exchange.plan.startAt)} → {formatDate(exchange.plan.dueAt)} ·
              Dispute raised {formatDate(exchange.dispute.raisedOn)}
            </p>
            <p className="mt-2 text-xs font-bold">
              Claimed {money(exchange.dispute.claimedAmount)} · Evidence{' '}
              {exchange.dispute.evidence.length}
            </p>
            {exchange.dispute.evidence.length > 0 && (
              <div className="mt-3 flex gap-2">
                {exchange.dispute.evidence.map((photo) => (
                  <img
                    className="h-14 w-14 rounded-lg object-cover"
                    src={photo}
                    alt="Dispute evidence"
                    key={photo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
          <input
            type="number"
            min="0"
            value={deduction}
            onChange={(event) => setDeduction(Number(event.target.value))}
            className="field"
            placeholder="Deduction"
          />
          <input
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            className="field"
            placeholder="Resolution note"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() =>
              dispatch({
                type: 'resolveDispute',
                exchangeId: exchange.id,
                status: 'Resolved',
                damageDeduction: deduction,
                resolution,
              })
            }
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
          >
            Approve deduction
          </button>
          <button
            onClick={() =>
              dispatch({
                type: 'resolveDispute',
                exchangeId: exchange.id,
                status: 'Rejected',
                damageDeduction: 0,
                resolution,
              })
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
          >
            Reject claim
          </button>
        </div>
      </div>
    )
  }
}

const Overview = ({
  revenue,
  pendingPayments,
  state,
  revenueOverTime,
}: {
  revenue: number
  pendingPayments: number
  state: ReturnType<typeof useApp>['state']
  revenueOverTime: { label: string; revenue: number }[]
}) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[
      ['Platform revenue', money(revenue)],
      ['Pending payments', pendingPayments],
      [
        'Active exchanges',
        state.exchanges.filter(
          (exchange) => !['Rated', 'Rejected', 'Cancelled'].includes(exchange.status),
        ).length,
      ],
      ['Overdue', state.exchanges.filter((exchange) => exchange.status === 'Return Due').length],
      [
        'Open disputes',
        state.exchanges.filter((exchange) => exchange.dispute?.status === 'Open').length,
      ],
    ].map(([label, value]) => (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        key={label as string}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {label as string}
        </p>
        <p className="mt-3 text-3xl font-black">{value as string | number}</p>
      </div>
    ))}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-4">
      <h2 className="text-lg font-black">Revenue from platform fees</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              tickFormatter={(value: number) => `₹${value}`}
              label={{ value: 'Platform fees (₹)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip formatter={(value: number) => money(value)} />
            <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)
