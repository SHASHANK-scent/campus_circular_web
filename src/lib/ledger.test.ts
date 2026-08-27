import { describe, expect, it } from 'vitest'
import { seedState } from '../data/seed'
import { formatOverdue, ledgerRows, ledgerSummary } from './ledger'

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
    expect(rows[0].lateByHours).toBe(18)
    expect(ledgerSummary(state).overdueNow).toBe(1)
    expect(rows[0].refunded).toBeUndefined()
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

  it('uses the grace period for returned-late classification and preserves unsettled refunds', () => {
    const state = structuredClone(seedState)
    state.exchanges = [{
      ...state.exchanges[0],
      status: 'Returned',
      plan: { ...state.exchanges[0].plan, dueAt: '2025-03-10T10:00:00.000Z' },
      returnedAt: '2025-03-10T10:20:00.000Z',
      payment: { ...state.exchanges[0].payment, status: 'Paid' },
    }]
    const row = ledgerRows(state)[0]
    expect(row.lateByHours).toBe(0)
    expect(row.overdue).toBe(false)
    expect(ledgerSummary(state).returnedLate).toBe(0)
    expect(ledgerSummary(state).returnedOnTime).toBe(1)
    expect(row.refunded).toBeUndefined()
  })

  it('formats long overdue durations as days and hours', () => {
    expect(formatOverdue(48)).toBe('48h overdue')
    expect(formatOverdue(1056)).toBe('44d 0h overdue')
  })

  it('keeps seeded late fines and return reports internally consistent', () => {
    const rows = ledgerRows(seedState)
    const yamaha = rows.find((row) => row.title === 'Yamaha Acoustic Guitar')
    const jbl = rows.find((row) => row.title === 'JBL PartyBox Speaker')
    expect(yamaha?.lateByHours).toBe(2)
    expect(yamaha?.fines.find((fine) => fine.reason === 'Late return')?.amount).toBe(30)
    expect(yamaha?.conditionBefore).toBeDefined()
    expect(yamaha?.conditionAfter).toBeDefined()
    expect(jbl?.conditionBefore).toBe('Good')
    expect(jbl?.conditionAfter).toBe('Fair')
  })
})
