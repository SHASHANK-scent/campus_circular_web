import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { seedState } from '../data/seed'
import type { AppState, ConditionReport, Exchange, Rating } from '../data/types'
import { advanceClock } from '../lib/clock'
import { canTransition, roleFor, withTimeline } from '../lib/lifecycle'
import { calculatePricing } from '../lib/pricing'

const KEY = 'cc.state.v1'

export type Action =
  | { type: 'advance'; hours: number }
  | { type: 'reset' }
  | { type: 'switchUser'; userId: string }
  | { type: 'admin'; value: boolean }
  | { type: 'createExchange'; exchange: Exchange }
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

const initial = (): AppState => {
  const saved = localStorage.getItem(KEY)
  return saved ? (JSON.parse(saved) as AppState) : structuredClone(seedState)
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
    const late = calculatePricing({
      resource,
      mode: exchange.plan.mode,
      units: exchange.plan.units,
      platform: state.config,
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
  if (action.type === 'transition') {
    const exchange = state.exchanges.find((item) => item.id === action.exchangeId)
    const role = exchange ? roleFor(exchange, state.currentUserId) : null
    if (!exchange || !role || !canTransition(exchange, action.status, role)) return state
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
        const pricing = calculatePricing({
          resource,
          mode: exchange.plan.mode,
          units: exchange.plan.units,
          platform: state.config,
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
    exchangeForRating.status !== 'Settlement'
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
