import { describe, expect, it } from 'vitest'
import { seedState } from '../data/seed'
import { ledgerRows, ledgerSummary } from './ledger'

describe('handover and return ledger', () => {
  it('identifies still-out and overdue exchanges against simulated time', () => {
    const state = structuredClone(seedState)
    state.exchanges = [{
      ...state.exchanges[0],
      status: 'Handover',
      plan: { ...state.exchanges[0].plan, dueAt: '2025-03-14T10:00:00.000Z' },
      timeline: [{ status: 'Handover', at: '2025-03-13T10:00:00.000Z' }],
      returnedAt: undefined,
    }]
    const rows = ledgerRows(state)
    expect(rows[0].stillOut).toBe(true)
    expect(rows[0].overdue).toBe(true)
    expect(rows[0].lateByHours).toBe(19)
    expect(ledgerSummary(state).overdueNow).toBe(1)
  })

  it('reports returned on time and late hours', () => {
    const state = structuredClone(seedState)
    state.exchanges = state.exchanges.slice(0, 2).map((exchange, index) => ({
      ...exchange,
      status: 'Settlement' as const,
      plan: { ...exchange.plan, dueAt: '2025-03-10T10:00:00.000Z' },
      returnedAt: index === 0 ? '2025-03-10T12:00:00.000Z' : '2025-03-10T10:00:00.000Z',
    }))
    const rows = ledgerRows(state)
    expect(rows.find((row) => row.exchange.id === state.exchanges[0].id)?.lateByHours).toBe(2)
    expect(ledgerSummary(state).returnedLate).toBe(1)
    expect(ledgerSummary(state).returnedOnTime).toBe(1)
  })
})
