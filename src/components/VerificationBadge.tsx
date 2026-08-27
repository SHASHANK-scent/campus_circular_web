import { BadgeCheck, Clock3, ScanSearch, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Resource, User, VerificationStatus } from '../data/types'
import { formatDate } from '../lib/clock'
import { ownerVerificationLevel } from '../lib/verification'

const resourceTone: Record<VerificationStatus, { label: string; className: string }> = {
  Verified: {
    label: 'Verified equipment',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  'Under Inspection': {
    label: 'Under inspection',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  Submitted: {
    label: 'Awaiting inspection',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  },
  Rejected: {
    label: 'Verification failed',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
}

const StatusIcon = ({ status }: { status: VerificationStatus }) => {
  if (status === 'Verified') return <BadgeCheck className="h-3.5 w-3.5" />
  if (status === 'Under Inspection') return <ScanSearch className="h-3.5 w-3.5" />
  if (status === 'Submitted') return <Clock3 className="h-3.5 w-3.5" />
  return <ShieldAlert className="h-3.5 w-3.5" />
}

export const VerificationBadge = ({
  resource,
  verifierName,
  subline = false,
}: {
  resource: Resource
  verifierName?: string
  subline?: boolean
}) => {
  const { status, inspectedAt } = resource.verification
  const tone = resourceTone[status]
  const evidence =
    status === 'Verified' && inspectedAt
      ? `Checked${verifierName ? ` by ${verifierName}` : ''} on ${formatDate(inspectedAt)}`
      : resource.verification.note
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span
        title={evidence ?? tone.label}
        className={`inline-flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${tone.className}`}
      >
        <StatusIcon status={status} /> {tone.label}
      </span>
      {subline && evidence && <span className="text-[10px] text-slate-500">{evidence}</span>}
    </span>
  )
}

export const OwnerVerificationBadge = ({ user }: { user: User }) => {
  const level = ownerVerificationLevel(user.verification)
  const className =
    level === 'Fully Verified'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : level === 'Basic'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-50 text-slate-600'
  return (
    <span
      title={`Owner verification: ${level}`}
      className={`inline-flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5" /> Owner {level.toLowerCase()}
    </span>
  )
}
