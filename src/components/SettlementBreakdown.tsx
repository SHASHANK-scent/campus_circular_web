import type { Exchange, Resource, PlatformConfig } from '../data/types'
import { settlementForExchange } from '../lib/lifecycle'
import { money } from './Layout'

export const SettlementBreakdown = ({
  exchange,
  resource,
  config,
  now,
}: {
  exchange: Exchange
  resource: Resource
  config: PlatformConfig
  now: string
}) => {
  const pricing = settlementForExchange(exchange, resource, config, now)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Settlement</p>
      <h2 className="mt-1 text-xl font-black">A transparent return</h2>
      <div className="mt-5 space-y-3 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Borrowing Charge</span>
          <b>{money(pricing.borrowFee)}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Platform Fee</span>
          <b>{money(pricing.platformFee)}</b>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-3">
          <span className="text-slate-500">Security Deposit (refundable)</span>
          <b>{money(pricing.deposit)}</b>
        </div>
        <div className="flex justify-between text-sm font-black">
          <span>Transaction Amount</span>
          <span className="text-emerald-700">{money(pricing.payableUpfront)}</span>
        </div>
      </div>
      <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-xs">
        <p className="font-black text-emerald-900">Deposit return</p>
        <div className="mt-3 space-y-2 text-emerald-800">
          <div className="flex justify-between">
            <span>Deposit</span>
            <b>{money(pricing.deposit)}</b>
          </div>
          <div className="flex justify-between">
            <span>− Late Fee ({pricing.hoursLate}h)</span>
            <b>− {money(pricing.lateFee)}</b>
          </div>
          <div className="flex justify-between">
            <span>− Damage</span>
            <b>− {money(pricing.damageDeduction)}</b>
          </div>
          <div className="flex justify-between border-t border-emerald-200 pt-2 text-sm font-black">
            <span>Refund</span>
            <b>{money(pricing.refund)}</b>
          </div>
          {exchange.fines.length > 0 && (
            <div className="mt-3 border-t border-emerald-200 pt-3">
              <p className="font-black">Fine itemisation</p>
              {exchange.fines.map((fine) => (
                <div className="mt-1 flex justify-between" key={fine.id}>
                  <span>{fine.reason} · {fine.status}</span>
                  <b>{money(fine.amount)}</b>
                </div>
              ))}
              <div className="mt-2 flex justify-between font-bold">
                <span>Total fines (capped)</span><b>{money(pricing.finesTotal)}</b>
              </div>
              <div className="flex justify-between"><span>From deposit</span><b>{money(Math.min(pricing.finesTotal, pricing.deposit))}</b></div>
              {pricing.outstanding > 0 && (
                <div className="flex justify-between font-bold text-rose-700"><span>Outstanding</span><b>{money(pricing.outstanding)}</b></div>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Net to owner: <strong className="text-slate-900">{money(pricing.netToOwner)}</strong> ·
        Platform keeps {money(pricing.platformFee)}.
      </p>
    </div>
  )
}
