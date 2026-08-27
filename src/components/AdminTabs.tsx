import { useMemo, useState } from 'react'
import { Check, Flag, ShieldAlert, Trash2, UserCheck, X } from 'lucide-react'
import { Badge, money } from './Layout'
import { useApp } from '../store/AppStore'

type Tab = 'Overview' | 'Users' | 'Resources' | 'Exchanges' | 'Disputes' | 'Settings'

export const AdminTabs = () => {
  const [tab, setTab] = useState<Tab>('Overview')
  const { state, dispatch } = useApp()
  const [exchangeFilter, setExchangeFilter] = useState('All')
  const [feePercent, setFeePercent] = useState(state.config.platformFeePercent)
  const [feeMin, setFeeMin] = useState(state.config.platformFeeMin)
  const [feeMax, setFeeMax] = useState(state.config.platformFeeMax)
  const [grace, setGrace] = useState(state.config.gracePeriodMinutes)
  const revenue = state.exchanges.reduce((sum, exchange) => sum + exchange.charges.platformFee, 0)
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
        {(['Overview', 'Users', 'Resources', 'Exchanges', 'Disputes', 'Settings'] as Tab[]).map(
          (item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold ${tab === item ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {item}
            </button>
          ),
        )}
      </div>
      {tab === 'Overview' && <Overview revenue={revenue} state={state} />}
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
                  <td className="p-4">{user.trustScore}</td>
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
                  {resource.category} · {resource.approvalStatus}
                </p>
              </div>
              <div className="flex gap-2">
                {resource.approvalStatus === 'Pending' && (
                  <>
                    <button
                      onClick={() =>
                        dispatch({
                          type: 'adminResource',
                          resourceId: resource.id,
                          action: 'approve',
                        })
                      }
                      className="rounded-lg bg-emerald-600 p-2 text-white"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        dispatch({
                          type: 'adminResource',
                          resourceId: resource.id,
                          action: 'reject',
                        })
                      }
                      className="rounded-lg bg-slate-900 p-2 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
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

  function DisputeRow({ exchange }: { exchange: (typeof state.exchanges)[number] }) {
    const [deduction, setDeduction] = useState(
      exchange.charges.damageDeduction || exchange.dispute?.claimedAmount || 0,
    )
    const [resolution, setResolution] = useState(exchange.dispute?.resolution ?? '')
    if (!exchange.dispute) return null
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600" />
          <div className="flex-1">
            <div className="flex justify-between gap-3">
              <h2 className="font-black">
                {exchange.id} · {exchange.dispute.type}
              </h2>
              <Badge tone={exchange.dispute.status === 'Open' ? 'rose' : 'green'}>
                {exchange.dispute.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-600">{exchange.dispute.description}</p>
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
  state,
}: {
  revenue: number
  state: ReturnType<typeof useApp>['state']
}) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[
      ['Platform revenue', money(revenue)],
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
      <div className="mt-4 flex h-20 items-end gap-2">
        {state.exchanges.map((exchange, index) => (
          <div
            className="flex-1 rounded-t bg-emerald-500"
            style={{ height: `${Math.max(15, exchange.charges.platformFee * 2)}%` }}
            key={exchange.id}
            title={`${exchange.id}: ${money(exchange.charges.platformFee)}`}
          >
            <span className="sr-only">{index}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)
