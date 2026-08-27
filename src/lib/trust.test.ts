import { describe, expect, it } from 'vitest'
import { seedState } from '../data/seed'
import { avgRating, trustBreakdown, trustScore } from './trust'

describe('live trust scores', () => {
  it('blends historical and live ratings and applies a damaged one-star review', () => {
    const state = structuredClone(seedState)
    const user = state.users.find((item) => item.id === 'u8')!
    const before = trustScore(user, [])
    state.exchanges = [{
      ...state.exchanges[0],
      borrowerId: user.id,
      status: 'Rated',
      ratingByOwner: { stars: 1, comment: 'Returned damaged', at: state.simulatedNow, tags: ['Returned damaged'] },
    }]
    expect(avgRating(user, state.exchanges)).toBeLessThan(user.rating)
    expect(trustScore(user, state.exchanges)).toBeLessThan(before)
  })

  it('subtracts late returns and borrower disputes', () => {
    const state = structuredClone(seedState)
    const user = state.users[0]
    const exchange = { ...state.exchanges[0], borrowerId: user.id, returnedAt: '2025-03-20T10:00:00.000Z', dispute: { id: 'd', raisedBy: user.id, type: 'Late' as const, description: '', evidence: [], claimedAmount: 0, status: 'Open' as const, raisedOn: state.simulatedNow } }
    const breakdown = trustBreakdown(user, [exchange])
    expect(breakdown.lateReturns).toBe(user.lateReturns + 1)
    expect(breakdown.disputes).toBe(user.disputes + 1)
    expect(breakdown.lateReturnPenalty).toBeGreaterThan(0)
    expect(breakdown.disputePenalty).toBeGreaterThan(0)
  })
})
