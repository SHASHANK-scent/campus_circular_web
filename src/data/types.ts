export type UserId = string
export type Category =
  | 'Camera & Video'
  | 'Audio'
  | 'Computing'
  | 'Books'
  | 'Sports'
  | 'Tools'
  | 'Music'
  | 'Event & Decor'
  | 'Lab & Electronics'
export type Condition = 'Like New' | 'Good' | 'Fair' | 'Worn'
export type ExchangeStatus =
  | 'Requested'
  | 'Accepted'
  | 'Handover'
  | 'Borrowed'
  | 'Return Due'
  | 'Returned'
  | 'Inspection'
  | 'Settlement'
  | 'Rated'
  | 'Rejected'
  | 'Cancelled'

export interface User {
  id: UserId
  name: string
  avatarInitials: string
  department: string
  year: string
  verified: boolean
  trustScore: number
  rating: number
  ratingsCount: number
  successfulExchanges: number
  lateReturns: number
  disputes: number
  joinedOn: string
  hostel: string
  distanceMeters: number
  badges: string[]
  suspended?: boolean
  flagged?: boolean
}
export interface Resource {
  id: string
  title: string
  category: Category
  description: string
  images: string[]
  ownerId: UserId
  condition: Condition
  accessories: string[]
  location: string
  distanceMeters: number
  hourlyCharge: number
  dailyCharge: number
  retailValue: number
  minimumCharge: number
  deposit: number
  lateFeePerHour: number
  availability: {
    status: 'Available' | 'Borrowed' | 'Unavailable'
    nextFreeFrom?: string
    blockedRanges: { from: string; to: string }[]
  }
  borrowingConditions: string[]
  rating: number
  timesBorrowed: number
  approvalStatus: 'Approved' | 'Pending' | 'Rejected'
  flagged: boolean
  history: {
    exchangeId: string
    borrowerId: UserId
    onTime: boolean
    endedOn: string
    note?: string
  }[]
  tags: string[]
  removed?: boolean
}
export interface ConditionReport {
  at: string
  by: UserId
  overall: Condition
  checklist: { label: string; ok: boolean; note?: string }[]
  photos: string[]
  notes: string
}
export interface Dispute {
  id: string
  raisedBy: UserId
  type: 'Damage' | 'Loss' | 'Late' | 'Other'
  description: string
  evidence: string[]
  claimedAmount: number
  status: 'Open' | 'Under Review' | 'Resolved' | 'Rejected'
  resolution?: string
  raisedOn: string
}
export interface Rating {
  stars: number
  comment: string
  at: string
}
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded'
export interface Payment {
  status: PaymentStatus
  method: 'Campus Wallet' | 'UPI (simulated)'
  amount: number
  txnId: string
  paidAt?: string
  refund?: { amount: number; txnId: string; at: string }
}
export interface Exchange {
  id: string
  resourceId: string
  ownerId: UserId
  borrowerId: UserId
  createdOn: string
  status: ExchangeStatus
  timeline: { status: ExchangeStatus; at: string; note?: string }[]
  plan: { mode: 'hourly' | 'daily'; units: number; startAt: string; dueAt: string }
  charges: {
    borrowFee: number
    platformFee: number
    deposit: number
    lateFee: number
    damageDeduction: number
  }
  payment: Payment
  returnedAt?: string
  before?: ConditionReport
  after?: ConditionReport
  dispute?: Dispute
  ratingByOwner?: Rating
  ratingByBorrower?: Rating
  purpose?: string
}
export interface CommunityRequest {
  id: string
  byUserId: UserId
  text: string
  category?: Category
  neededFrom: string
  neededTo: string
  status: 'Open' | 'Fulfilled'
  responses: { userId: string; resourceId: string; note: string; at: string }[]
}
export interface PlatformConfig {
  platformFeePercent: number
  platformFeeMin: number
  platformFeeMax: number
  gracePeriodMinutes: number
}
export interface AppState {
  stateVersion: number
  users: User[]
  resources: Resource[]
  exchanges: Exchange[]
  requests: CommunityRequest[]
  config: PlatformConfig
  currentUserId: string
  simulatedNow: string
  isAdmin: boolean
}
