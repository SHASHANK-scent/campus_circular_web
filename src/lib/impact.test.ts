import { describe, expect, it } from 'vitest'
import { seedState } from '../data/seed'
import { aggregateImpact } from './impact'

describe('impact aggregations', () => {
  it('calculates money saved and on-time percentage from exchanges', () => {
    const state = structuredClone(seedState)
    state.exchanges = state.exchanges.slice(0, 2)
    state.exchanges[0].status = 'Returned'
    state.exchanges[0].returnedAt = state.exchanges[0].plan.dueAt
    state.exchanges[1].status = 'Returned'
    state.exchanges[1].returnedAt = new Date(
      new Date(state.exchanges[1].plan.dueAt).getTime() + 3600000,
    ).toISOString()
    const metrics = aggregateImpact(state)
    expect(metrics.onTimePercent).toBe(50)
    expect(metrics.moneySaved).toBeGreaterThan(0)
  })
})
