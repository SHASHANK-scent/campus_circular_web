import { describe, expect, it } from 'vitest'
import { seedExchanges, seedResources } from '../data/seed'
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
  payment: {
    status: 'Paid',
    method: 'Campus Wallet',
    amount: 80 + 10 + resource.deposit,
    txnId: 'CC-PAY-test',
    paidAt: '2025-03-15T10:00:00.000Z',
  },
})

describe('exchange lifecycle', () => {
  it('keeps every seeded exchange between different people', () => {
    expect(seedExchanges().every((exchange) => exchange.ownerId !== exchange.borrowerId)).toBe(true)
  })

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

  it('freezes agreed charges when live pricing changes', () => {
    const pricing = settlementForExchange(
      {
        ...baseExchange('Settlement'),
        returnedAt: '2025-03-16T10:00:00.000Z',
      },
      { ...resource, dailyCharge: 9999, deposit: 1 },
      {
        platformFeePercent: 40,
        platformFeeMin: 50,
        platformFeeMax: 500,
        gracePeriodMinutes: 30,
      },
      '2025-03-16T10:00:00.000Z',
    )
    expect(pricing.borrowFee).toBe(80)
    expect(pricing.platformFee).toBe(10)
    expect(pricing.deposit).toBe(resource.deposit)
    expect(pricing.payableUpfront).toBe(80 + 10 + resource.deposit)
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
      stateVersion: 2,
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

  it('blocks handover until the borrower has paid', () => {
    const state: AppState = {
      stateVersion: 6,
      users: [],
      resources: [resource],
      exchanges: [
        {
          ...baseExchange('Accepted'),
          payment: { ...baseExchange('Accepted').payment, status: 'Pending' },
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
      simulatedNow: '2025-03-15T10:00:00.000Z',
      isAdmin: false,
    }
    const blocked = reducer(state, {
      type: 'transition',
      exchangeId: 'test-exchange',
      status: 'Handover',
    })
    expect(blocked.exchanges[0].status).toBe('Accepted')
    const paid = {
      ...state,
      exchanges: [
        {
          ...state.exchanges[0],
          payment: { ...state.exchanges[0].payment, status: 'Paid' as const },
        },
      ],
    }
    const allowed = reducer(paid, {
      type: 'transition',
      exchangeId: 'test-exchange',
      status: 'Handover',
    })
    expect(allowed.exchanges[0].status).toBe('Handover')
  })

  it('allows only the borrower to pay, records the receipt, and ignores double payment', () => {
    const pending = {
      ...baseExchange('Accepted'),
      payment: { ...baseExchange('Accepted').payment, status: 'Pending' as const },
    }
    const state: AppState = {
      stateVersion: 6,
      users: [],
      resources: [resource],
      exchanges: [pending],
      requests: [],
      config: {
        platformFeePercent: 5,
        platformFeeMin: 10,
        platformFeeMax: 150,
        gracePeriodMinutes: 30,
      },
      currentUserId: 'u2',
      simulatedNow: '2025-03-15T10:00:00.000Z',
      isAdmin: false,
    }
    const ownerAttempt = reducer(state, {
      type: 'payExchange',
      exchangeId: 'test-exchange',
      method: 'UPI (simulated)',
    })
    expect(ownerAttempt).toBe(state)
    const borrowerPaid = reducer(
      { ...state, currentUserId: 'u1' },
      { type: 'payExchange', exchangeId: 'test-exchange', method: 'UPI (simulated)' },
    )
    expect(borrowerPaid.exchanges[0].payment).toMatchObject({
      status: 'Paid',
      method: 'UPI (simulated)',
      paidAt: state.simulatedNow,
    })
    expect(borrowerPaid.exchanges[0].timeline.at(-1)?.note).toContain('Payment received')
    const secondAttempt = reducer(borrowerPaid, {
      type: 'payExchange',
      exchangeId: 'test-exchange',
      method: 'Campus Wallet',
    })
    expect(secondAttempt).toBe(borrowerPaid)
  })

  it('stores an admin-set deduction when settlement is completed', () => {
    const state: AppState = {
      stateVersion: 2,
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
    expect(settled.exchanges[0].payment.status).toBe('Refunded')
    expect(settled.exchanges[0].payment.refund?.amount).toBe(resource.deposit - 125)
  })

  it('feeds an admin dispute resolution into settlement damage deduction', () => {
    const state: AppState = {
      stateVersion: 2,
      users: [],
      resources: [resource],
      exchanges: [
        {
          ...baseExchange('Inspection'),
          dispute: {
            id: 'd-test',
            raisedBy: 'u2',
            type: 'Damage',
            description: 'A scratch was found.',
            evidence: [],
            claimedAmount: 200,
            status: 'Open',
            raisedOn: '2025-03-16T10:00:00.000Z',
          },
        },
      ],
      requests: [],
      config: {
        platformFeePercent: 5,
        platformFeeMin: 10,
        platformFeeMax: 150,
        gracePeriodMinutes: 30,
      },
      currentUserId: 'u1',
      simulatedNow: '2025-03-16T10:00:00.000Z',
      isAdmin: true,
    }
    const resolved = reducer(state, {
      type: 'resolveDispute',
      exchangeId: 'test-exchange',
      status: 'Resolved',
      damageDeduction: 125,
      resolution: 'Approved partial claim.',
    })
    expect(resolved.exchanges[0].charges.damageDeduction).toBe(125)
    const settlement = settlementForExchange(
      resolved.exchanges[0],
      resource,
      state.config,
      state.simulatedNow,
    )
    expect(settlement.damageDeduction).toBe(125)
    expect(settlement.refund).toBe(resource.deposit - 125)
  })
})
