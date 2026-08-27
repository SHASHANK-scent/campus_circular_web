import { describe, expect, it } from 'vitest'
import { seedResources } from '../data/seed'
import type { AppState, Exchange } from '../data/types'
import { canTransition, roleFor, settlementForExchange } from './lifecycle'
import { reducer } from '../store/AppStore'

const resource = seedResources[0]
const baseExchange = (status: Exchange['status'] = 'Borrowed'): Exchange => ({
  id: 'test-exchange',
  resourceId: resource.id,
  ownerId: 'u2',
  borrowerId: 'u1',
  createdOn: '2025-03-15T10:00:00.000Z',
  status,
  timeline: [{ status: 'Requested', at: '2025-03-15T10:00:00.000Z' }],
  plan: {
    mode: 'daily',
    units: 1,
    startAt: '2025-03-15T10:00:00.000Z',
    dueAt: '2025-03-16T10:00:00.000Z',
  },
  charges: {
    borrowFee: 80,
    platformFee: 10,
    deposit: resource.deposit,
    lateFee: 0,
    damageDeduction: 0,
  },
})

describe('exchange lifecycle', () => {
  it('allows only the correct role to perform each transition', () => {
    const requested = baseExchange('Requested')
    expect(roleFor(requested, 'u2')).toBe('owner')
    expect(roleFor(requested, 'u1')).toBe('borrower')
    expect(canTransition(requested, 'Accepted', 'owner')).toBe(true)
    expect(canTransition(requested, 'Accepted', 'borrower')).toBe(false)
    expect(canTransition(baseExchange('Borrowed'), 'Returned', 'borrower')).toBe(true)
    expect(canTransition(baseExchange('Borrowed'), 'Returned', 'owner')).toBe(false)
    expect(canTransition(baseExchange('Inspection'), 'Settlement', 'owner')).toBe(true)
    expect(canTransition(baseExchange('Inspection'), 'Settlement', 'borrower')).toBe(false)
  })

  it('calculates an on-time settlement with a full deposit refund', () => {
    const pricing = settlementForExchange(
      { ...baseExchange('Settlement'), returnedAt: '2025-03-16T10:00:00.000Z' },
      resource,
      {
        platformFeePercent: 5,
        platformFeeMin: 10,
        platformFeeMax: 150,
        gracePeriodMinutes: 30,
      },
      '2025-03-16T10:00:00.000Z',
    )
    expect(pricing.borrowFee).toBe(80)
    expect(pricing.platformFee).toBe(10)
    expect(pricing.payableUpfront).toBe(80 + 10 + resource.deposit)
    expect(pricing.lateFee).toBe(0)
    expect(pricing.refund).toBe(resource.deposit)
    expect(pricing.netToOwner).toBe(80)
  })

  it('grows the late fee after the grace period', () => {
    const pricing = settlementForExchange(
      { ...baseExchange('Return Due'), returnedAt: '2025-03-16T12:31:00.000Z' },
      resource,
      {
        platformFeePercent: 5,
        platformFeeMin: 10,
        platformFeeMax: 150,
        gracePeriodMinutes: 30,
      },
      '2025-03-16T12:31:00.000Z',
    )
    expect(pricing.hoursLate).toBe(3)
    expect(pricing.lateFee).toBe(resource.lateFeePerHour * 3)
    expect(pricing.refund).toBe(resource.deposit - pricing.lateFee)
  })

  it('caps an admin-set damage deduction at the deposit', () => {
    const pricing = settlementForExchange(
      {
        ...baseExchange('Settlement'),
        returnedAt: '2025-03-16T10:00:00.000Z',
        charges: { ...baseExchange().charges, damageDeduction: 9999 },
      },
      resource,
      {
        platformFeePercent: 5,
        platformFeeMin: 10,
        platformFeeMax: 150,
        gracePeriodMinutes: 30,
      },
      '2025-03-16T10:00:00.000Z',
    )
    expect(pricing.damageDeduction).toBe(resource.deposit)
    expect(pricing.refund).toBe(0)
    expect(pricing.netToOwner).toBe(80 + resource.deposit)
  })

  it('moves a borrowed exchange to Return Due as the demo clock advances', () => {
    const state: AppState = {
      users: [],
      resources: [resource],
      exchanges: [baseExchange()],
      requests: [],
      config: {
        platformFeePercent: 5,
        platformFeeMin: 10,
        platformFeeMax: 150,
        gracePeriodMinutes: 30,
      },
      currentUserId: 'u1',
      simulatedNow: '2025-03-15T10:00:00.000Z',
      isAdmin: false,
    }
    const advanced = reducer(state, { type: 'advance', hours: 27 })
    expect(advanced.exchanges[0].status).toBe('Return Due')
    expect(advanced.exchanges[0].charges.lateFee).toBe(resource.lateFeePerHour * 3)
  })

  it('stores an admin-set deduction when settlement is completed', () => {
    const state: AppState = {
      users: [],
      resources: [resource],
      exchanges: [
        {
          ...baseExchange('Settlement'),
          returnedAt: '2025-03-16T10:00:00.000Z',
        },
      ],
      requests: [],
      config: {
        platformFeePercent: 5,
        platformFeeMin: 10,
        platformFeeMax: 150,
        gracePeriodMinutes: 30,
      },
      currentUserId: 'u2',
      simulatedNow: '2025-03-16T10:00:00.000Z',
      isAdmin: true,
    }
    const settled = reducer(state, {
      type: 'settle',
      exchangeId: 'test-exchange',
      damageDeduction: 125,
    })
    expect(settled.exchanges[0].status).toBe('Settlement')
    expect(settled.exchanges[0].charges.damageDeduction).toBe(125)
    expect(settled.exchanges[0].charges.lateFee).toBe(0)
  })
})
