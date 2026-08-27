import type { Exchange, ExchangeStatus, PlatformConfig, Resource } from '../data/types'
import { activeFineSubtotals, activeFinesTotal, applyDamageFine } from './fines'
import { settleCharges, type PriceBreakdown } from './pricing'

export const LIFECYCLE_STEPS: ExchangeStatus[] = [
  'Requested',
  'Accepted',
  'Handover',
  'Borrowed',
  'Return Due',
  'Returned',
  'Inspection',
  'Settlement',
  'Rated',
]

export type ExchangeRole = 'owner' | 'borrower'

export const roleFor = (exchange: Exchange, userId: string): ExchangeRole | null => {
  if (exchange.ownerId === userId) return 'owner'
  if (exchange.borrowerId === userId) return 'borrower'
  return null
}

export const canTransition = (
  exchange: Exchange,
  next: ExchangeStatus,
  role: ExchangeRole,
): boolean => {
  const allowed: Record<ExchangeStatus, { next: ExchangeStatus; roles: ExchangeRole[] }[]> = {
    Requested: [
      { next: 'Accepted', roles: ['owner'] },
      { next: 'Rejected', roles: ['owner'] },
    ],
    Accepted: [{ next: 'Handover', roles: ['owner'] }],
    Handover: [{ next: 'Borrowed', roles: ['owner'] }],
    Borrowed: [
      { next: 'Return Due', roles: ['borrower'] },
      { next: 'Returned', roles: ['borrower'] },
    ],
    'Return Due': [{ next: 'Returned', roles: ['borrower'] }],
    Returned: [{ next: 'Inspection', roles: ['owner'] }],
    Inspection: [{ next: 'Settlement', roles: ['owner'] }],
    Settlement: [{ next: 'Rated', roles: ['owner', 'borrower'] }],
    Rated: [],
    Rejected: [],
    Cancelled: [],
  }
  return allowed[exchange.status].some(
    (transition) => transition.next === next && transition.roles.includes(role),
  )
}

export const settlementForExchange = (
  exchange: Exchange,
  resource: Resource,
  config: PlatformConfig,
  at: string,
  damageDeduction?: number,
): PriceBreakdown => {
  const preparedExchange =
    damageDeduction === undefined ? exchange : applyDamageFine(exchange, damageDeduction, at)
  return settleCharges({
    charges: preparedExchange.charges,
    lateFeePerHour: resource.lateFeePerHour,
    gracePeriodMinutes: config.gracePeriodMinutes,
    dueAt: preparedExchange.plan.dueAt,
    returnedAt: preparedExchange.returnedAt ?? at,
    fines: activeFinesTotal(preparedExchange.fines),
    fineCapMultiplier: config.fineCapMultiplier,
    fineSubtotals: activeFineSubtotals(preparedExchange.fines),
  })
}

export const withTimeline = (
  exchange: Exchange,
  status: ExchangeStatus,
  at: string,
  note?: string,
): Exchange => ({
  ...exchange,
  status,
  timeline: [...exchange.timeline, { status, at, note }],
})
