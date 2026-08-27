import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { seedState } from '../data/seed'
import type {
  AppState,
  CommunityRequest,
  ConditionReport,
  Exchange,
  Payment,
  PlatformConfig,
  Rating,
  Resource,
} from '../data/types'
import { advanceClock } from '../lib/clock'
import { canTransition, roleFor, withTimeline } from '../lib/lifecycle'
import { settleCharges } from '../lib/pricing'

const KEY = 'cc.state.v1'
export const STATE_VERSION = 6

export type Action =
  | { type: 'advance'; hours: number }
  | { type: 'reset' }
  | { type: 'switchUser'; userId: string }
  | { type: 'admin'; value: boolean }
  | { type: 'createExchange'; exchange: Exchange }
  | { type: 'payExchange'; exchangeId: string; method: Payment['method'] }
  | { type: 'transition'; exchangeId: string; status: Exchange['status']; note?: string }
  | { type: 'condition'; exchangeId: string; report: ConditionReport; side: 'before' | 'after' }
  | {
      type: 'damage'
      exchangeId: string
      claimedAmount: number
      description: string
      evidence: string[]
    }
  | { type: 'settle'; exchangeId: string; damageDeduction?: number }
  | { type: 'rating'; exchangeId: string; rating: Rating; side: 'owner' | 'borrower' }
  | { type: 'createResource'; resource: Resource }
  | { type: 'createRequest'; request: CommunityRequest }
  | { type: 'respondRequest'; requestId: string; resourceId: string; note: string }
  | { type: 'adminUser'; userId: string; action: 'verify' | 'suspend' | 'flag' }
  | {
      type: 'adminResource'
      resourceId: string
      action: 'approve' | 'reject' | 'flag' | 'remove'
    }
  | {
      type: 'resolveDispute'
      exchangeId: string
      status: 'Resolved' | 'Rejected'
      damageDeduction: number
      resolution: string
    }
  | { type: 'updateConfig'; config: Partial<PlatformConfig> }

const isPayment = (value: unknown): value is Payment => {
  if (!value || typeof value !== 'object') return false
  const payment = value as Partial<Payment>
  const refund = payment.refund
  return (
    (payment.status === 'Pending' ||
      payment.status === 'Paid' ||
      payment.status === 'Refunded') &&
    (payment.method === 'Campus Wallet' || payment.method === 'UPI (simulated)') &&
    typeof payment.amount === 'number' &&
    typeof payment.txnId === 'string' &&
    (payment.paidAt === undefined || typeof payment.paidAt === 'string') &&
    (refund === undefined ||
      (typeof refund === 'object' &&
        typeof refund.amount === 'number' &&
        typeof refund.txnId === 'string' &&
        typeof refund.at === 'string'))
  )
}

const isAppState = (value: unknown): value is AppState => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppState>
  const paymentsValid =
    Array.isArray(candidate.exchanges) &&
    candidate.exchanges.every((exchange) => {
      if (!exchange || typeof exchange !== 'object') return false
      return isPayment((exchange as Partial<Exchange>).payment)
    })
  return (
    candidate.stateVersion === STATE_VERSION &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.resources) &&
    Array.isArray(candidate.exchanges) &&
    paymentsValid &&
    Array.isArray(candidate.requests) &&
    typeof candidate.currentUserId === 'string' &&
    typeof candidate.simulatedNow === 'string' &&
    typeof candidate.isAdmin === 'boolean' &&
    Boolean(candidate.config) &&
    typeof candidate.config?.platformFeePercent === 'number' &&
    typeof candidate.config.platformFeeMin === 'number' &&
    typeof candidate.config.platformFeeMax === 'number' &&
    typeof candidate.config.gracePeriodMinutes === 'number'
  )
}

const initial = (): AppState => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (isAppState(parsed)) return parsed
    }
  } catch {
    return structuredClone(seedState)
  }
  return structuredClone(seedState)
}

const refreshLateFees = (state: AppState, simulatedNow: string): AppState['exchanges'] =>
  state.exchanges.map((exchange) => {
    if (exchange.status !== 'Borrowed' && exchange.status !== 'Return Due') return exchange
    const overdue = new Date(simulatedNow).getTime() >= new Date(exchange.plan.dueAt).getTime()
    if (!overdue && exchange.status === 'Borrowed') return exchange
    const next =
      exchange.status === 'Borrowed'
        ? withTimeline(exchange, 'Return Due', simulatedNow, 'The simulated deadline has passed.')
        : exchange
    const resource = state.resources.find((item) => item.id === exchange.resourceId)
    if (!resource) return next
    const late = settleCharges({
      charges: next.charges,
      lateFeePerHour: resource.lateFeePerHour,
      gracePeriodMinutes: state.config.gracePeriodMinutes,
      dueAt: exchange.plan.dueAt,
      returnedAt: simulatedNow,
      damageDeduction: next.charges.damageDeduction,
    })
    return { ...next, charges: { ...next.charges, lateFee: late.lateFee } }
  })

export const reducer = (state: AppState, action: Action): AppState => {
  if (action.type === 'reset') return structuredClone(seedState)
  if (action.type === 'advance') {
    const simulatedNow = advanceClock(state.simulatedNow, action.hours)
    return { ...state, simulatedNow, exchanges: refreshLateFees(state, simulatedNow) }
  }
  if (action.type === 'switchUser') return { ...state, currentUserId: action.userId }
  if (action.type === 'admin') return { ...state, isAdmin: action.value }
  if (action.type === 'createExchange') {
    return { ...state, exchanges: [...state.exchanges, action.exchange] }
  }
  if (action.type === 'payExchange') {
    const exchange = state.exchanges.find((item) => item.id === action.exchangeId)
    if (
      !exchange ||
      exchange.borrowerId !== state.currentUserId ||
      exchange.status !== 'Accepted' ||
      exchange.payment.status !== 'Pending'
    ) {
      return state
    }
    return {
      ...state,
      exchanges: state.exchanges.map((item) =>
        item.id === action.exchangeId
          ? {
              ...item,
              payment: {
                ...item.payment,
                status: 'Paid' as const,
                method: action.method,
                paidAt: state.simulatedNow,
              },
              timeline: [
                ...item.timeline,
                {
                  status: item.status,
                  at: state.simulatedNow,
                  note: `Payment received via ${action.method}.`,
                },
              ],
            }
          : item,
      ),
    }
  }
  if (action.type === 'createResource') {
    return { ...state, resources: [...state.resources, action.resource] }
  }
  if (action.type === 'createRequest') {
    return { ...state, requests: [action.request, ...state.requests] }
  }
  if (action.type === 'respondRequest') {
    return {
      ...state,
      requests: state.requests.map((request) =>
        request.id === action.requestId
          ? {
              ...request,
              responses: [
                ...request.responses,
                {
                  userId: state.currentUserId,
                  resourceId: action.resourceId,
                  note: action.note,
                  at: state.simulatedNow,
                },
              ],
            }
          : request,
      ),
    }
  }
  if (action.type === 'adminUser') {
    return {
      ...state,
      users: state.users.map((user) =>
        user.id === action.userId
          ? {
              ...user,
              ...(action.action === 'verify' ? { verified: !user.verified } : {}),
              ...(action.action === 'suspend' ? { suspended: !user.suspended } : {}),
              ...(action.action === 'flag' ? { flagged: !user.flagged } : {}),
            }
          : user,
      ),
    }
  }
  if (action.type === 'adminResource') {
    return {
      ...state,
      resources: state.resources.map((resource) =>
        resource.id === action.resourceId
          ? {
              ...resource,
              ...(action.action === 'approve' ? { approvalStatus: 'Approved' as const } : {}),
              ...(action.action === 'reject' ? { approvalStatus: 'Rejected' as const } : {}),
              ...(action.action === 'flag' ? { flagged: !resource.flagged } : {}),
              ...(action.action === 'remove' ? { removed: true } : {}),
            }
          : resource,
      ),
    }
  }
  if (action.type === 'updateConfig') {
    return { ...state, config: { ...state.config, ...action.config } }
  }
  if (action.type === 'resolveDispute') {
    return {
      ...state,
      exchanges: state.exchanges.map((exchange) =>
        exchange.id === action.exchangeId && exchange.dispute
          ? {
              ...exchange,
              dispute: {
                ...exchange.dispute,
                status: action.status,
                resolution: action.resolution,
              },
              charges: {
                ...exchange.charges,
                damageDeduction: Math.min(
                  exchange.charges.deposit,
                  Math.max(0, action.damageDeduction),
                ),
              },
            }
          : exchange,
      ),
    }
  }
  if (action.type === 'transition') {
    const exchange = state.exchanges.find((item) => item.id === action.exchangeId)
    const role = exchange ? roleFor(exchange, state.currentUserId) : null
    if (
      !exchange ||
      !role ||
      !canTransition(exchange, action.status, role) ||
      (action.status === 'Handover' && exchange.payment.status === 'Pending')
    ) {
      return state
    }
    return {
      ...state,
      exchanges: state.exchanges.map((exchange) =>
        exchange.id === action.exchangeId
          ? {
              ...withTimeline(exchange, action.status, state.simulatedNow, action.note),
              ...(action.status === 'Returned' ? { returnedAt: state.simulatedNow } : {}),
            }
          : exchange,
      ),
    }
  }
  if (action.type === 'condition') {
    const exchange = state.exchanges.find((item) => item.id === action.exchangeId)
    const role = exchange ? roleFor(exchange, state.currentUserId) : null
    if (
      !exchange ||
      role !== 'owner' ||
      (action.side === 'before' && exchange.status !== 'Accepted') ||
      (action.side === 'after' && exchange.status !== 'Returned')
    ) {
      return state
    }
    return {
      ...state,
      exchanges: state.exchanges.map((exchange) =>
        exchange.id === action.exchangeId
          ? { ...exchange, [action.side]: action.report }
          : exchange,
      ),
    }
  }
  if (action.type === 'damage') {
    const exchange = state.exchanges.find((item) => item.id === action.exchangeId)
    if (!exchange || exchange.ownerId !== state.currentUserId || exchange.status !== 'Inspection') {
      return state
    }
    return {
      ...state,
      exchanges: state.exchanges.map((exchange) =>
        exchange.id === action.exchangeId
          ? {
              ...exchange,
              dispute: {
                id: `d-${action.exchangeId}`,
                raisedBy: exchange.ownerId,
                type: 'Damage',
                description: action.description,
                evidence: action.evidence,
                claimedAmount: action.claimedAmount,
                status: 'Open',
                raisedOn: state.simulatedNow,
              },
            }
          : exchange,
      ),
    }
  }
  if (action.type === 'settle') {
    const exchangeForSettlement = state.exchanges.find((item) => item.id === action.exchangeId)
    if (
      !exchangeForSettlement ||
      exchangeForSettlement.ownerId !== state.currentUserId ||
      exchangeForSettlement.status !== 'Settlement'
    ) {
      return state
    }
    return {
      ...state,
      exchanges: state.exchanges.map((exchange) => {
        if (exchange.id !== action.exchangeId) return exchange
        const resource = state.resources.find((item) => item.id === exchange.resourceId)
        if (!resource) return exchange
        if (exchange.payment.status === 'Refunded') return exchange
        const pricing = settleCharges({
          charges: exchange.charges,
          lateFeePerHour: resource.lateFeePerHour,
          gracePeriodMinutes: state.config.gracePeriodMinutes,
          dueAt: exchange.plan.dueAt,
          returnedAt: exchange.returnedAt ?? state.simulatedNow,
          damageDeduction:
            action.damageDeduction ??
            exchange.charges.damageDeduction ??
            exchange.dispute?.claimedAmount ??
            0,
        })
        return {
          ...withTimeline(exchange, 'Settlement', state.simulatedNow, 'Settlement completed.'),
          charges: {
            ...exchange.charges,
            lateFee: pricing.lateFee,
            damageDeduction: pricing.damageDeduction,
          },
          payment: {
            ...exchange.payment,
            status: 'Refunded',
            refund: {
              amount: pricing.refund,
              txnId: `CC-RFD-${exchange.id}`,
              at: state.simulatedNow,
            },
          },
        }
      }),
    }
  }
  const exchangeForRating = state.exchanges.find((item) => item.id === action.exchangeId)
  const ratingRole = exchangeForRating ? roleFor(exchangeForRating, state.currentUserId) : null
  if (
    !exchangeForRating ||
    !ratingRole ||
    action.side !== ratingRole ||
    (exchangeForRating.status !== 'Settlement' && exchangeForRating.status !== 'Rated')
  ) {
    return state
  }
  return {
    ...state,
    exchanges: state.exchanges.map((exchange) => {
      if (exchange.id !== action.exchangeId) return exchange
      const updated = {
        ...exchange,
        ...(action.side === 'owner'
          ? { ratingByOwner: action.rating }
          : { ratingByBorrower: action.rating }),
      }
      if (updated.ratingByOwner && updated.ratingByBorrower && updated.status === 'Settlement') {
        return withTimeline(
          updated,
          'Rated',
          state.simulatedNow,
          'Both parties rated the exchange.',
        )
      }
      return updated
    }),
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null)

export const AppStore = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, initial)
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(state)), [state])
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export const useApp = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useApp must be used inside AppStore')
  return context
}
