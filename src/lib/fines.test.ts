import { describe, expect, it } from 'vitest'
import { settleCharges } from './pricing'

describe('fine settlement', () => {
  it('caps fines at twice the deposit and records an outstanding balance', () => {
    const result = settleCharges({
      charges: { borrowFee: 80, platformFee: 10, deposit: 300 },
      lateFeePerHour: 10,
      gracePeriodMinutes: 30,
      dueAt: '2025-03-10T10:00:00.000Z',
      returnedAt: '2025-03-10T10:00:00.000Z',
      fines: 800,
      fineCapMultiplier: 2,
      fineSubtotals: { lateFee: 800, damageDeduction: 0 },
    })
    expect(result.finesTotal).toBe(600)
    expect(result.refund).toBe(0)
    expect(result.outstanding).toBe(300)
    expect(result.netToOwner).toBe(680)
  })
})
