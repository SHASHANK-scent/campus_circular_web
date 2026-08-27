import { useState, type Dispatch } from 'react'
import type { Exchange, PlatformConfig, Resource } from '../data/types'
import { canTransition, roleFor, settlementForExchange } from '../lib/lifecycle'
import type { Action } from '../store/AppStore'
import { money } from './Layout'

export const ExchangeSidebar = ({
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
  const [adminDeduction, setAdminDeduction] = useState(0)
  const pricing = settlementForExchange(exchange, resource, config, now)
  const transition = (status: Exchange['status'], note?: string) => {
    if (role && canTransition(exchange, status, role)) {
      dispatch({ type: 'transition', exchangeId: exchange.id, status, note })
    }
  }
  return (
    <aside className="h-fit space-y-5 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Next action</p>
        {exchange.status === 'Requested' && role === 'owner' ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => transition('Accepted', 'Owner accepted the request.')}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white"
            >
              Accept
            </button>
            <button
              onClick={() => transition('Rejected', 'Owner rejected the request.')}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600"
            >
              Reject
            </button>
          </div>
        ) : exchange.status === 'Handover' && role === 'owner' ? (
          <button
            onClick={() => transition('Borrowed', 'Resource handed over.')}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white"
          >
            Confirm handover
          </button>
        ) : exchange.status === 'Borrowed' || exchange.status === 'Return Due' ? (
          role === 'borrower' ? (
            <button
              onClick={() =>
                dispatch({ type: 'transition', exchangeId: exchange.id, status: 'Returned' })
              }
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white"
            >
              Mark returned
            </button>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Waiting for the borrower to return it.</p>
          )
        ) : exchange.status === 'Returned' && role === 'owner' ? (
          <p className="mt-3 text-xs text-slate-500">Complete the return inspection on the left.</p>
        ) : exchange.status === 'Settlement' && role === 'owner' ? (
          <>
            {exchange.dispute && (
              <label className="mt-4 block text-xs font-bold text-slate-600">
                Approved damage deduction
                <input
                  type="number"
                  min="0"
                  max={resource.deposit}
                  value={adminDeduction}
                  onChange={(event) => setAdminDeduction(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </label>
            )}
            <button
              onClick={() =>
                dispatch({
                  type: 'settle',
                  exchangeId: exchange.id,
                  damageDeduction: exchange.dispute ? adminDeduction : undefined,
                })
              }
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white"
            >
              Settle now
            </button>
          </>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            {exchange.status === 'Rated'
              ? 'Exchange complete.'
              : 'No action required from you right now.'}
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Money held safely
        </p>
        <div className="mt-4 space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Borrowing charge</span>
            <b>{money(pricing.borrowFee)}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Platform fee</span>
            <b>{money(pricing.platformFee)}</b>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3">
            <span className="font-bold">Refundable deposit</span>
            <b className="text-emerald-700">{money(pricing.deposit)}</b>
          </div>
        </div>
      </div>
    </aside>
  )
}
