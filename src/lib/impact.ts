import type { AppState, Category } from '../data/types'
import { calculatePricing } from './pricing'

export interface ImpactMetrics {
  activeMembers: number
  resourcesShared: number
  successfulExchanges: number
  onTimePercent: number
  moneySaved: number
  itemsReused: number
  ownershipAvoided: number
  exchangesOverTime: { label: string; exchanges: number }[]
  popularCategories: { category: Category; exchanges: number }[]
  returnSplit: { name: string; value: number }[]
  topLenders: { name: string; exchanges: number }[]
}

export const aggregateImpact = (state: AppState): ImpactMetrics => {
  const completed = state.exchanges.filter(
    (exchange) => !['Requested', 'Rejected', 'Cancelled'].includes(exchange.status),
  )
  const returned = state.exchanges.filter((exchange) => exchange.returnedAt)
  const onTime = returned.filter(
    (exchange) =>
      new Date(exchange.returnedAt ?? '').getTime() <=
      new Date(exchange.plan.dueAt).getTime() + state.config.gracePeriodMinutes * 60000,
  ).length
  const resourcesShared = state.resources.filter((resource) => resource.timesBorrowed > 0).length
  const moneySaved = completed.reduce((total, exchange) => {
    const resource = state.resources.find((item) => item.id === exchange.resourceId)
    if (!resource) return total
    const pricing = calculatePricing({
      resource,
      mode: exchange.plan.mode,
      units: exchange.plan.units,
      platform: state.config,
    })
    return total + Math.max(0, resource.dailyCharge * 2 * exchange.plan.units - pricing.borrowFee)
  }, 0)
  const categoryCounts = new Map<Category, number>()
  state.resources.forEach((resource) => {
    const count =
      resource.timesBorrowed +
      state.exchanges.filter((exchange) => exchange.resourceId === resource.id).length
    categoryCounts.set(resource.category, (categoryCounts.get(resource.category) ?? 0) + count)
  })
  const lenderCounts = new Map<string, number>()
  state.exchanges.forEach((exchange) => {
    lenderCounts.set(exchange.ownerId, (lenderCounts.get(exchange.ownerId) ?? 0) + 1)
  })
  const monthCounts = new Map<string, number>()
  state.exchanges.forEach((exchange) => {
    const label = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(
      new Date(exchange.createdOn),
    )
    monthCounts.set(label, (monthCounts.get(label) ?? 0) + 1)
  })
  return {
    activeMembers: state.users.filter((user) => !user.suspended).length,
    resourcesShared,
    successfulExchanges: completed.length,
    onTimePercent: returned.length ? Math.round((onTime / returned.length) * 100) : 0,
    moneySaved: Math.round(moneySaved),
    itemsReused: state.resources.reduce((total, resource) => total + resource.timesBorrowed, 0),
    ownershipAvoided:
      state.resources.reduce((total, resource) => total + resource.timesBorrowed, 0) * 1.8,
    exchangesOverTime: [...monthCounts.entries()].map(([label, exchanges]) => ({
      label,
      exchanges,
    })),
    popularCategories: [...categoryCounts.entries()]
      .map(([category, exchanges]) => ({ category, exchanges }))
      .sort((a, b) => b.exchanges - a.exchanges),
    returnSplit: [
      { name: 'On time', value: onTime },
      { name: 'Late', value: Math.max(0, returned.length - onTime) },
    ],
    topLenders: [...lenderCounts.entries()]
      .map(([userId, exchanges]) => ({
        name: state.users.find((user) => user.id === userId)?.name ?? userId,
        exchanges,
      }))
      .sort((a, b) => b.exchanges - a.exchanges),
  }
}
