import type { Exchange, Rating, User } from '../data/types'
import { calculateHoursLate } from './pricing'

export interface TrustBreakdown {
  base: number
  ratings: number
  exchanges: number
  lateReturnPenalty: number
  disputePenalty: number
  avgRating: number
  lateReturns: number
  disputes: number
  exchangesDone: number
}

export const liveReviews = (user: User, exchanges: Exchange[]): Rating[] =>
  exchanges.flatMap((exchange) => {
    if (exchange.borrowerId === user.id && exchange.ratingByOwner) return [exchange.ratingByOwner]
    if (exchange.ownerId === user.id && exchange.ratingByBorrower) return [exchange.ratingByBorrower]
    return []
  })

export const avgRating = (user: User, exchanges: Exchange[]): number => {
  const reviews = liveReviews(user, exchanges)
  const weight = user.ratingsCount + reviews.length
  if (!weight) return 0
  return (user.rating * user.ratingsCount + reviews.reduce((sum, review) => sum + review.stars, 0)) / weight
}

export const trustBreakdown = (
  user: User,
  exchanges: Exchange[],
  gracePeriodMinutes = 30,
): TrustBreakdown => {
  const borrowerExchanges = exchanges.filter((exchange) => exchange.borrowerId === user.id)
  const lateReturns =
    user.lateReturns +
    borrowerExchanges.filter((exchange) => {
      if (!exchange.returnedAt) return false
      return calculateHoursLate(exchange.plan.dueAt, exchange.returnedAt, gracePeriodMinutes) > 0
    }).length
  const disputes =
    user.disputes +
    borrowerExchanges.filter((exchange) =>
      ['Open', 'Under Review', 'Resolved'].includes(exchange.dispute?.status ?? ''),
    ).length
  const exchangesDone =
    user.successfulExchanges +
    exchanges.filter(
      (exchange) =>
        (exchange.ownerId === user.id || exchange.borrowerId === user.id) &&
        ['Settlement', 'Rated'].includes(exchange.status),
    ).length
  const rating = avgRating(user, exchanges)
  const base = 40
  const ratings = 8 * rating
  const exchangeBonus = Math.min(20, exchangesDone * 2)
  const lateReturnPenalty = 5 * lateReturns
  const disputePenalty = 8 * disputes
  return {
    base,
    ratings,
    exchanges: exchangeBonus,
    lateReturnPenalty,
    disputePenalty,
    avgRating: rating,
    lateReturns,
    disputes,
    exchangesDone,
  }
}

export const trustScore = (
  user: User,
  exchanges: Exchange[],
  gracePeriodMinutes = 30,
): number => {
  const breakdown = trustBreakdown(user, exchanges, gracePeriodMinutes)
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        breakdown.base +
          breakdown.ratings +
          breakdown.exchanges -
          breakdown.lateReturnPenalty -
          breakdown.disputePenalty,
      ),
    ),
  )
}
