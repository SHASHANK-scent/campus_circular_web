import type { AppState, Category } from '../data/types'

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
  feeRevenueOverTime: { label: string; revenue: number }[]
}

export const aggregateImpact = (state: AppState): ImpactMetrics => {
  const completed = state.exchanges.filter(
    (exchange) => !['Requested', 'Rejected', 'Cancelled'].includes(exchange.status),
  )
  const returnRecords = new Map<string, boolean>()
  state.exchanges
    .filter((exchange) => exchange.returnedAt)
    .forEach((exchange) => {
      const returnedAt = new Date(exchange.returnedAt ?? '').getTime()
      const dueAt =
        new Date(exchange.plan.dueAt).getTime() + state.config.gracePeriodMinutes * 60000
      returnRecords.set(exchange.id, returnedAt <= dueAt)
    })
  state.resources.forEach((resource) => {
    resource.history.forEach((history) => {
      if (!returnRecords.has(history.exchangeId))
        returnRecords.set(history.exchangeId, history.onTime)
    })
  })
  const returned = [...returnRecords.values()]
  const onTime = returned.filter(Boolean).length
  const resourcesShared = state.resources.filter((resource) => !resource.removed).length
  const borrowedResourceIds = new Set(
    state.resources
      .filter((resource) => resource.timesBorrowed > 0 || resource.history.length > 0)
      .map((resource) => resource.id),
  )
  state.exchanges.forEach((exchange) => borrowedResourceIds.add(exchange.resourceId))
  const exchangeCounts = new Map<string, number>()
  completed.forEach((exchange) => {
    exchangeCounts.set(exchange.resourceId, (exchangeCounts.get(exchange.resourceId) ?? 0) + 1)
  })
  const moneySaved = state.resources.reduce((total, resource) => {
    const borrowEvents = Math.max(
      resource.timesBorrowed,
      resource.history.length,
      exchangeCounts.get(resource.id) ?? 0,
    )
    const estimatedOwnershipCostPerBorrow = resource.retailValue * 0.1
    const savedPerBorrow = Math.max(0, estimatedOwnershipCostPerBorrow - resource.dailyCharge)
    return total + savedPerBorrow * borrowEvents
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
  const now = new Date(state.simulatedNow).getTime()
  const weekBuckets = Array.from({ length: 8 }, (_, index) => {
    const olderDays = (8 - index) * 7
    const newerDays = (7 - index) * 7
    const start = now - olderDays * 24 * 60 * 60 * 1000
    const end = now - newerDays * 24 * 60 * 60 * 1000
    return {
      start,
      end,
      label: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(
        new Date(start),
      ),
    }
  })
  const inBucket = (date: string, bucket: (typeof weekBuckets)[number]) => {
    const timestamp = new Date(date).getTime()
    return timestamp >= bucket.start && timestamp < bucket.end
  }
  const exchangesOverTime = weekBuckets.map((bucket) => ({
    label: bucket.label,
    exchanges:
      state.exchanges.filter((exchange) => inBucket(exchange.createdOn, bucket)).length +
      state.resources.reduce(
        (total, resource) =>
          total + resource.history.filter((history) => inBucket(history.endedOn, bucket)).length,
        0,
      ),
  }))
  const feeRevenueOverTime = weekBuckets.map((bucket) => ({
    label: bucket.label,
    revenue: state.exchanges
      .filter((exchange) => inBucket(exchange.createdOn, bucket))
      .reduce((total, exchange) => total + exchange.charges.platformFee, 0),
  }))
  return {
    activeMembers: state.users.filter((user) => !user.suspended).length,
    resourcesShared,
    successfulExchanges: completed.length,
    onTimePercent: returned.length ? Math.round((onTime / returned.length) * 100) : 0,
    moneySaved: Math.round(moneySaved),
    itemsReused: borrowedResourceIds.size,
    ownershipAvoided:
      state.resources.reduce((total, resource) => total + resource.timesBorrowed, 0) * 1.8,
    exchangesOverTime,
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
    feeRevenueOverTime,
  }
}
