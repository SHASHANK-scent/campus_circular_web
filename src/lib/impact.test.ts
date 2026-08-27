import { describe, expect, it } from 'vitest'
import { seedState } from '../data/seed'
import { aggregateImpact } from './impact'

describe('impact aggregations', () => {
  it('calculates money saved and on-time percentage from exchanges', () => {
    const state = structuredClone(seedState)
    state.exchanges = []
    state.resources = [
      {
        ...state.resources[0],
        retailValue: 5000,
        dailyCharge: 100,
        timesBorrowed: 3,
        history: [
          {
            exchangeId: 'history-on-time',
            borrowerId: 'u2',
            onTime: true,
            endedOn: '2025-03-01T10:00:00.000Z',
          },
          {
            exchangeId: 'history-late',
            borrowerId: 'u3',
            onTime: false,
            endedOn: '2025-03-02T10:00:00.000Z',
          },
        ],
      },
    ]
    const metrics = aggregateImpact(state)
    expect(metrics.onTimePercent).toBe(50)
    expect(metrics.moneySaved).toBe(1200)
    expect(metrics.itemsReused).toBe(1)
  })

  it('keeps exchange and fee revenue timelines spread across seeded dates', () => {
    const metrics = aggregateImpact(structuredClone(seedState))
    expect(metrics.exchangesOverTime).toHaveLength(8)
    expect(new Set(metrics.exchangesOverTime.map((point) => point.exchanges)).size).toBeGreaterThan(
      1,
    )
    expect(metrics.feeRevenueOverTime).toHaveLength(8)
  })

  it('excludes pending payments from fee revenue', () => {
    const state = structuredClone(seedState)
    state.exchanges = state.exchanges.map((exchange) => ({
      ...exchange,
      createdOn: state.simulatedNow,
      payment: { ...exchange.payment, status: 'Pending' as const },
    }))
    const metrics = aggregateImpact(state)
    expect(metrics.feeRevenueOverTime.every((point) => point.revenue === 0)).toBe(true)
  })
})
