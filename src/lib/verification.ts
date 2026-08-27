import type {
  EquipmentCheck,
  OwnerVerification,
  OwnerVerificationLevel,
  Resource,
  User,
} from '../data/types'

export const STANDARD_CHECKS: string[] = [
  'All listed accessories present',
  'Physical condition matches listing',
  'Powers on / functions correctly',
  'Ownership proof shown',
  'No safety or damage risk',
]

export const ownerVerificationLevel = (
  verification: OwnerVerification,
): OwnerVerificationLevel => {
  const passed = [
    verification.identityVerified,
    verification.campusVerified,
    verification.contactVerified,
  ].filter(Boolean).length
  if (passed === 3) return 'Fully Verified'
  return passed > 0 ? 'Basic' : 'Unverified'
}

export const allChecksPassed = (checks: EquipmentCheck[]): boolean =>
  checks.length > 0 && checks.every((check) => check.passed)

export const isPubliclyListed = (resource: Resource): boolean =>
  resource.verification.status === 'Verified' &&
  resource.approvalStatus === 'Approved' &&
  !resource.removed

export const isFullyVerified = (resource: Resource, owner: User): boolean =>
  resource.verification.status === 'Verified' &&
  ownerVerificationLevel(owner.verification) === 'Fully Verified'

export const pendingVerificationCount = (resources: Resource[]): number =>
  resources.filter(
    (resource) =>
      resource.verification.status === 'Submitted' ||
      resource.verification.status === 'Under Inspection',
  ).length

export const newResourceVerification = (submittedAt: string) => ({
  status: 'Submitted' as const,
  submittedAt,
  checks: STANDARD_CHECKS.map((label) => ({ label, passed: false })),
})
