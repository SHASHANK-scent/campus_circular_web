import { describe, expect, it } from 'vitest'
import { calculateLateFee, calculatePricing } from './pricing'
import type { Resource } from '../data/types'
const resource: Resource = {
  id: 'test',
  title: 'Test item',
  category: 'Tools',
  description: '',
  images: [],
  ownerId: 'u1',
  condition: 'Good',
  accessories: [],
  location: '',
  distanceMeters: 10,
  hourlyCharge: 5,
  dailyCharge: 100,
  retailValue: 1000,
  minimumCharge: 50,
  deposit: 300,
  lateFeePerHour: 100,
  availability: { status: 'Available', blockedRanges: [] },
  borrowingConditions: [],
  rating: 4,
  timesBorrowed: 0,
  approvalStatus: 'Approved',
  verification: {
    status: 'Verified',
    submittedAt: '2025-03-01T10:00:00.000Z',
    inspectedAt: '2025-03-02T10:00:00.000Z',
    verifierId: 'u2',
    verifiedCondition: 'Good',
    checks: [{ label: 'Ownership proof shown', passed: true }],
  },
  flagged: false,
  history: [],
  tags: ['test'],
}
describe('pricing rules', () => {
  it('enforces the minimum charge floor', () =>
    expect(calculatePricing({ resource, mode: 'hourly', units: 1 }).borrowFee).toBe(50))
  it('clamps platform fee at both minimum and maximum', () => {
    expect(
      calculatePricing({
        resource: { ...resource, dailyCharge: 100 },
        mode: 'daily',
        units: 1,
        platform: {
          platformFeePercent: 1,
          platformFeeMin: 10,
          platformFeeMax: 150,
          gracePeriodMinutes: 30,
          fineCapMultiplier: 2,
        },
      }).platformFee,
    ).toBe(10)
    expect(
      calculatePricing({
        resource: { ...resource, dailyCharge: 10000 },
        mode: 'daily',
        units: 1,
        platform: {
          platformFeePercent: 10,
          platformFeeMin: 10,
          platformFeeMax: 150,
          gracePeriodMinutes: 30,
          fineCapMultiplier: 2,
        },
      }).platformFee,
    ).toBe(150)
  })
  it('applies grace then caps late fee at deposit', () => {
    const due = '2025-03-15T10:00:00.000Z'
    expect(calculateLateFee(due, '2025-03-15T10:29:00.000Z', 30, 100, 300).lateFee).toBe(0)
    expect(calculateLateFee(due, '2025-03-15T14:31:00.000Z', 30, 100, 300)).toEqual({
      hoursLate: 5,
      lateFee: 300,
    })
  })
  it('floors refund at zero', () =>
    expect(
      calculatePricing({
        resource,
        mode: 'daily',
        units: 1,
        dueAt: '2025-03-15T10:00:00.000Z',
        returnedAt: '2025-03-15T20:00:00.000Z',
        damageDeduction: 300,
      }).refund,
    ).toBe(0))
})
