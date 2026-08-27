import type { PlatformConfig, Resource } from '../data/types'
export interface PricingInput {
  resource: Resource
  mode: 'hourly' | 'daily'
  units: number
  platform?: PlatformConfig
  dueAt?: string
  returnedAt?: string
  damageDeduction?: number
}
export interface PriceBreakdown {
  borrowFee: number
  platformFee: number
  deposit: number
  lateFee: number
  damageDeduction: number
  payableUpfront: number
  refund: number
  netToOwner: number
  hoursLate: number
  finesTotal: number
  outstanding: number
}
export interface SettlementInput {
  charges: { borrowFee: number; platformFee: number; deposit: number }
  lateFeePerHour: number
  gracePeriodMinutes: number
  dueAt: string
  returnedAt: string
  fines: number
  fineCapMultiplier: number
  fineSubtotals: { lateFee: number; damageDeduction: number }
}
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
export const calculateLateFee = (
  dueAt: string,
  returnedAt: string,
  gracePeriodMinutes: number,
  lateFeePerHour: number,
  deposit: number,
) => {
  const hoursLate = calculateHoursLate(dueAt, returnedAt, gracePeriodMinutes)
  return { hoursLate, lateFee: Math.min(hoursLate * lateFeePerHour, deposit) }
}
export const calculateHoursLate = (
  dueAt: string,
  returnedAt: string,
  gracePeriodMinutes: number,
): number =>
  Math.max(
    0,
    Math.ceil(
      (new Date(returnedAt).getTime() - new Date(dueAt).getTime() - gracePeriodMinutes * 60000) /
        3600000,
    ),
  )
export const calculatePricing = ({
  resource,
  mode,
  units,
  platform = {
    platformFeePercent: 5,
    platformFeeMin: 10,
    platformFeeMax: 150,
    gracePeriodMinutes: 30,
    fineCapMultiplier: 2,
  },
  dueAt,
  returnedAt,
  damageDeduction = 0,
}: PricingInput): PriceBreakdown => {
  const borrowFee = Math.max(
    resource.minimumCharge,
    (mode === 'hourly' ? resource.hourlyCharge : resource.dailyCharge) * units,
  )
  const platformFee = clamp(
    Math.round((borrowFee * platform.platformFeePercent) / 100),
    platform.platformFeeMin,
    platform.platformFeeMax,
  )
  const late =
    dueAt && returnedAt
      ? calculateLateFee(
          dueAt,
          returnedAt,
          platform.gracePeriodMinutes,
          resource.lateFeePerHour,
          resource.deposit,
        )
      : { hoursLate: 0, lateFee: 0 }
  const damage = clamp(damageDeduction, 0, resource.deposit)
  const refund = Math.max(0, resource.deposit - late.lateFee - damage)
  return {
    borrowFee,
    platformFee,
    deposit: resource.deposit,
    lateFee: late.lateFee,
    damageDeduction: damage,
    payableUpfront: borrowFee + platformFee + resource.deposit,
    refund,
    netToOwner: borrowFee + late.lateFee + damage,
    hoursLate: late.hoursLate,
    finesTotal: late.lateFee + damage,
    outstanding: 0,
  }
}
export const settleCharges = ({
  charges,
  lateFeePerHour,
  gracePeriodMinutes,
  dueAt,
  returnedAt,
  fines,
  fineCapMultiplier,
  fineSubtotals,
}: SettlementInput): PriceBreakdown => {
  const late = calculateLateFee(
    dueAt,
    returnedAt,
    gracePeriodMinutes,
    lateFeePerHour,
    charges.deposit,
  )
  const finesTotal = Math.min(Math.max(0, fines), charges.deposit * fineCapMultiplier)
  const fromDeposit = Math.min(finesTotal, charges.deposit)
  const refund = Math.max(0, charges.deposit - fromDeposit)
  return {
    borrowFee: charges.borrowFee,
    platformFee: charges.platformFee,
    deposit: charges.deposit,
    lateFee: fineSubtotals.lateFee,
    damageDeduction: fineSubtotals.damageDeduction,
    payableUpfront: charges.borrowFee + charges.platformFee + charges.deposit,
    refund,
    netToOwner: charges.borrowFee + finesTotal,
    hoursLate: late.hoursLate,
    finesTotal,
    outstanding: Math.max(0, finesTotal - charges.deposit),
  }
}
