import type { Exchange, Fine, PlatformConfig, Resource } from '../data/types'
import { calculateLateFee } from './pricing'

export const activeFineSubtotals = (fines: Fine[]) => ({
  lateFee: fines
    .filter((fine) => fine.reason === 'Late return' && fine.status !== 'Waived')
    .reduce((sum, fine) => sum + fine.amount, 0),
  damageDeduction: fines
    .filter((fine) => fine.reason !== 'Late return' && fine.status !== 'Waived')
    .reduce((sum, fine) => sum + fine.amount, 0),
})

export const activeFinesTotal = (fines: Fine[]): number =>
  fines
    .filter((fine) => fine.status !== 'Waived')
    .reduce((sum, fine) => sum + fine.amount, 0)

export const applyLateFine = (
  exchange: Exchange,
  resource: Resource,
  config: PlatformConfig,
  at: string,
): Exchange => {
  const { hoursLate } = calculateLateFee(
    exchange.plan.dueAt,
    at,
    config.gracePeriodMinutes,
    resource.lateFeePerHour,
    exchange.charges.deposit,
  )
  const lateAmount = hoursLate * resource.lateFeePerHour
  const existing = exchange.fines.find((fine) => fine.reason === 'Late return')
  const fines =
    hoursLate <= 0
      ? exchange.fines
      : existing
        ? exchange.fines.map((fine) =>
            fine.id === existing.id && fine.status !== 'Waived'
              ? {
                  ...fine,
                  amount: lateAmount,
                  note: `${hoursLate} hour(s) late`,
                  status: 'Pending' as const,
                }
              : fine,
          )
        : [
            ...exchange.fines,
            {
              id: `fine-late-${exchange.id}`,
              reason: 'Late return' as const,
              amount: lateAmount,
              note: `${hoursLate} hour(s) late`,
              issuedBy: exchange.ownerId,
              issuedAt: at,
              status: 'Pending' as const,
            },
          ]
  return { ...exchange, fines, charges: { ...exchange.charges, lateFee: lateAmount } }
}
