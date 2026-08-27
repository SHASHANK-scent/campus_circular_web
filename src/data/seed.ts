import type {
  AppState,
  Category,
  Condition,
  OwnerVerification,
  Payment,
  Resource,
  ResourceVerification,
  User,
  Fine,
} from './types'
import { settleCharges } from '../lib/pricing'
import { activeFineSubtotals, activeFinesTotal } from '../lib/fines'
import { ownerVerificationLevel, STANDARD_CHECKS } from '../lib/verification'

const now = new Date('2025-03-15T10:00:00+05:30')
const iso = (days: number, hours = 0) =>
  new Date(now.getTime() + (days * 24 + hours) * 3600000).toISOString()
const exchangeAges = [53, 46, 45, 37, 30, 22, 21, 4]
const historyAges = [50, 43, 36, 29, 22, 15, 8, 2]
const evidencePhoto =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Crect width='160' height='120' fill='%23ffe4e6'/%3E%3Ccircle cx='80' cy='60' r='32' fill='%23fb7185'/%3E%3Cpath d='M57 80l46-40M65 88l42-34' stroke='%239f1239' stroke-width='6'/%3E%3C/svg%3E"
const afterEvidencePhoto =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Crect width='160' height='120' fill='%23fee2e2'/%3E%3Crect x='42' y='30' width='76' height='60' rx='12' fill='%23fb7185'/%3E%3Cpath d='M58 72l44-30' stroke='%239f1239' stroke-width='7'/%3E%3C/svg%3E"
const ownerVerification = (
  identityVerified: boolean,
  campusVerified: boolean,
  contactVerified: boolean,
  verifiedAt?: string,
): OwnerVerification => {
  const flags = { identityVerified, campusVerified, contactVerified }
  const level = ownerVerificationLevel({ ...flags, level: 'Unverified' })
  return {
    ...flags,
    level,
    ...(level === 'Unverified' ? {} : { verifiedAt: verifiedAt ?? iso(-70) }),
  }
}
const fullyVerified = () => ownerVerification(true, true, true)
export const seedUsers: User[] = [
  {
    id: 'u1',
    name: 'Aarav Menon',
    avatarInitials: 'AM',
    department: 'Computer Science',
    year: '3rd year',
    verified: true,
    trustScore: 86,
    rating: 4.8,
    ratingsCount: 24,
    successfulExchanges: 31,
    lateReturns: 1,
    disputes: 0,
    joinedOn: '2023-08-12',
    hostel: 'Azad Hall',
    distanceMeters: 0,
    badges: ['Early adopter', 'Reliable lender', 'Community builder'],
    verification: fullyVerified(),
  },
  {
    id: 'u2',
    name: 'Ishita Rao',
    avatarInitials: 'IR',
    department: 'Mass Communication',
    year: '2nd year',
    verified: true,
    trustScore: 94,
    rating: 4.9,
    ratingsCount: 42,
    successfulExchanges: 54,
    lateReturns: 0,
    disputes: 0,
    joinedOn: '2022-07-10',
    hostel: 'Ganga Hostel',
    distanceMeters: 450,
    badges: ['Top lender', 'Verified identity', 'Campus Verifier'],
    verification: fullyVerified(),
  },
  {
    id: 'u3',
    name: 'Kabir Shah',
    avatarInitials: 'KS',
    department: 'Mechanical Engineering',
    year: '4th year',
    verified: true,
    trustScore: 78,
    rating: 4.5,
    ratingsCount: 18,
    successfulExchanges: 22,
    lateReturns: 2,
    disputes: 0,
    joinedOn: '2023-01-17',
    hostel: 'Tagore House',
    distanceMeters: 800,
    badges: ['Fixer'],
    verification: fullyVerified(),
  },
  {
    id: 'u4',
    name: 'Meera Iyer',
    avatarInitials: 'MI',
    department: 'Design',
    year: '3rd year',
    verified: true,
    trustScore: 91,
    rating: 4.7,
    ratingsCount: 28,
    successfulExchanges: 38,
    lateReturns: 1,
    disputes: 0,
    joinedOn: '2022-09-04',
    hostel: 'Nalanda Hall',
    distanceMeters: 1200,
    badges: ['Event helper', 'Top lender'],
    verification: fullyVerified(),
  },
  {
    id: 'u5',
    name: 'Rohan Das',
    avatarInitials: 'RD',
    department: 'Physics',
    year: '1st year',
    verified: false,
    trustScore: 41,
    rating: 3.4,
    ratingsCount: 9,
    successfulExchanges: 12,
    lateReturns: 2,
    disputes: 1,
    joinedOn: '2024-07-22',
    hostel: 'Azad Hall',
    distanceMeters: 300,
    badges: ['New member'],
    verification: ownerVerification(true, false, true),
  },
  {
    id: 'u6',
    name: 'Zoya Khan',
    avatarInitials: 'ZK',
    department: 'Economics',
    year: '2nd year',
    verified: false,
    trustScore: 67,
    rating: 4.2,
    ratingsCount: 11,
    successfulExchanges: 14,
    lateReturns: 1,
    disputes: 0,
    joinedOn: '2023-11-02',
    hostel: 'Ganga Hostel',
    distanceMeters: 1700,
    badges: [],
    verification: ownerVerification(true, true, false),
  },
  {
    id: 'u7',
    name: 'Dev Patel',
    avatarInitials: 'DP',
    department: 'Electrical Engineering',
    year: '4th year',
    verified: true,
    trustScore: 88,
    rating: 4.8,
    ratingsCount: 31,
    successfulExchanges: 45,
    lateReturns: 0,
    disputes: 0,
    joinedOn: '2022-08-19',
    hostel: 'Tagore House',
    distanceMeters: 650,
    badges: ['Lab pro'],
    verification: fullyVerified(),
  },
  {
    id: 'u8',
    name: 'Ananya Sen',
    avatarInitials: 'AS',
    department: 'Literature',
    year: '3rd year',
    verified: true,
    trustScore: 83,
    rating: 4.6,
    ratingsCount: 15,
    successfulExchanges: 19,
    lateReturns: 1,
    disputes: 0,
    joinedOn: '2023-05-11',
    hostel: 'Nalanda Hall',
    distanceMeters: 950,
    badges: ['Bookworm'],
    verification: fullyVerified(),
  },
  {
    id: 'u9',
    name: 'Neil Thomas',
    avatarInitials: 'NT',
    department: 'Civil Engineering',
    year: '2nd year',
    verified: false,
    trustScore: 73,
    rating: 4.1,
    ratingsCount: 8,
    successfulExchanges: 9,
    lateReturns: 1,
    disputes: 0,
    joinedOn: '2024-01-08',
    hostel: 'Azad Hall',
    distanceMeters: 1400,
    badges: [],
    verification: ownerVerification(false, false, false),
  },
  {
    id: 'u10',
    name: 'Tara Kapoor',
    avatarInitials: 'TK',
    department: 'Music',
    year: '4th year',
    verified: true,
    trustScore: 96,
    rating: 5,
    ratingsCount: 36,
    successfulExchanges: 49,
    lateReturns: 0,
    disputes: 0,
    joinedOn: '2022-06-03',
    hostel: 'Ganga Hostel',
    distanceMeters: 1100,
    badges: ['Top lender', 'Perfect record', 'Campus Verifier'],
    verification: fullyVerified(),
  },
]

const catalog: [Category, string, string, string[]][] = [
  ['Camera & Video', 'Sony ZV-E10 Creator Camera', 'camera', ['camera', 'reel', 'video', 'shoot']],
  ['Camera & Video', 'DJI Osmo Pocket 3', 'camera', ['camera', 'vlog', 'video']],
  ['Camera & Video', 'Carbon Fibre Tripod', 'tripod', ['tripod', 'camera', 'shoot']],
  ['Camera & Video', 'Ring Light with Stand', 'light', ['lighting', 'light', 'reel']],
  ['Audio', 'Rode VideoMic Pro', 'microphone', ['microphone', 'audio', 'reel']],
  ['Audio', 'Zoom H1n Audio Recorder', 'recorder', ['audio recorder', 'record', 'podcast']],
  ['Audio', 'Bose QuietComfort Headphones', 'headphones', ['headphones', 'audio', 'podcast']],
  ['Audio', 'JBL PartyBox Speaker', 'speaker', ['speaker', 'event', 'music']],
  ['Computing', 'MacBook Air M2', 'laptop', ['laptop', 'presentation', 'project']],
  ['Computing', 'Epson Portable Projector', 'projector', ['projector', 'presentation', 'seminar']],
  ['Computing', 'Logitech Presentation Clicker', 'clicker', ['clicker', 'presentation']],
  ['Computing', 'Scientific Calculator', 'calculator', ['calculator', 'exam', 'study']],
  ['Books', 'Data Structures Textbook', 'textbook', ['textbook', 'exam', 'study']],
  ['Books', 'CAT Quant Prep Notes', 'notes', ['notes', 'exam', 'study']],
  ['Books', 'The Design of Everyday Things', 'book', ['book', 'design']],
  ['Sports', 'Decathlon Trekking Backpack', 'backpack', ['backpack', 'trek', 'hike']],
  ['Sports', 'Two-person Camping Tent', 'tent', ['tent', 'camp', 'trek']],
  ['Sports', 'Badminton Racket Pair', 'badminton racket', ['badminton racket', 'sports']],
  ['Sports', 'Leather Football', 'football', ['football', 'match', 'sports']],
  ['Tools', 'Bosch Cordless Drill', 'drill', ['drill', 'tools', 'project']],
  ['Tools', 'Allen Key & Repair Kit', 'tools', ['tools', 'repair']],
  ['Music', 'Yamaha Acoustic Guitar', 'guitar', ['guitar', 'music', 'jam']],
  ['Music', 'Casio Portable Keyboard', 'keyboard', ['keyboard', 'music', 'band']],
  ['Music', 'Orange Practice Amplifier', 'amplifier', ['amplifier', 'music', 'band']],
  ['Music', 'Cajon Percussion Box', 'cajon', ['cajon', 'music', 'jam']],
  [
    'Event & Decor',
    'Heavy Duty Extension Board',
    'extension board',
    ['extension board', 'event', 'stage'],
  ],
  ['Event & Decor', 'Modular Banner Stand', 'banner stand', ['banner stand', 'decor', 'event']],
  ['Lab & Electronics', 'Arduino Starter Kit', 'arduino kit', ['arduino kit', 'circuit', 'lab']],
  ['Lab & Electronics', 'Digital Multimeter', 'multimeter', ['multimeter', 'circuit', 'lab']],
  [
    'Lab & Electronics',
    'Soldering Iron Station',
    'soldering iron',
    ['soldering iron', 'project', 'circuit'],
  ],
]
const owners = ['u2', 'u4', 'u7', 'u10', 'u1', 'u3']
const verifiers = ['u2', 'u10']
const awaitingInspectionIndex = 26
const underInspectionIndex = 25
const rejectedIndex = 29
const resourceVerification = (index: number, condition: Condition): ResourceVerification => {
  if (index === rejectedIndex) {
    return {
      status: 'Rejected',
      submittedAt: iso(-65),
      inspectedAt: iso(-60),
      verifierId: verifiers[1],
      checks: STANDARD_CHECKS.map((label, position) => ({
        label,
        passed: position !== 2,
        ...(position === 2 ? { note: 'Did not power on during the check.' } : {}),
      })),
      note: 'Equipment failed the working-order check. Repair it and submit again.',
    }
  }
  if (index === underInspectionIndex) {
    return {
      status: 'Under Inspection',
      submittedAt: iso(-4),
      verifierId: verifiers[0],
      checks: STANDARD_CHECKS.map((label) => ({ label, passed: false })),
    }
  }
  if (index === awaitingInspectionIndex) {
    return {
      status: 'Submitted',
      submittedAt: iso(-1),
      checks: STANDARD_CHECKS.map((label) => ({ label, passed: false })),
    }
  }
  return {
    status: 'Verified',
    submittedAt: iso(-65),
    inspectedAt: iso(-60),
    verifierId: verifiers[index % verifiers.length],
    verifiedCondition: condition,
    checks: STANDARD_CHECKS.map((label) => ({ label, passed: true })),
    note: 'Full equipment check completed at the campus verification desk.',
  }
}
const conditions: Condition[] = ['Like New', 'Good', 'Good', 'Fair', 'Like New']
export const seedResources: Resource[] = catalog.map(([category, title, tag, tags], index) => ({
  id: `r${index + 1}`,
  title,
  category,
  description: `A dependable ${title.toLowerCase()} shared by the campus community. Checked before every handover and ready for your next project.`,
  images: [],
  ownerId: owners[index % owners.length],
  condition: conditions[index % conditions.length],
  accessories: ['Protective case', 'Quick-start guide'],
  location: [
    'Innovation Lab',
    'Ganga Hostel common room',
    'Central Library',
    'Student Activity Centre',
  ][index % 4],
  distanceMeters: 180 + ((index * 173) % 1750),
  hourlyCharge: 8 + (index % 5) * 4,
  dailyCharge: 80 + (index % 7) * 30,
  retailValue: 1200 + index * 350,
  minimumCharge: 40 + (index % 3) * 20,
  deposit: 300 + (index % 6) * 150,
  lateFeePerHour: 10 + (index % 4) * 5,
  availability: {
    status: index === 1 ? 'Borrowed' : index === 27 ? 'Unavailable' : 'Available',
    nextFreeFrom: index === 1 ? iso(1) : undefined,
    blockedRanges: index % 6 === 0 ? [{ from: iso(2), to: iso(3) }] : [],
  },
  borrowingConditions: [
    'Keep indoors and return with all accessories',
    'Student ID required at handover',
  ],
  rating: 4.1 + (index % 9) / 10,
  timesBorrowed: [1, 3, 6, 17, 25].includes(index) ? 0 : 5 + index * 2,
  approvalStatus:
    index === rejectedIndex
      ? 'Rejected'
      : index === underInspectionIndex || index === awaitingInspectionIndex
        ? 'Pending'
        : 'Approved',
  verification: resourceVerification(index, conditions[index % conditions.length]),
  flagged: index === 4,
  history:
    index % 4 === 0
      ? [
          {
            exchangeId: `history-${index + 1}`,
            borrowerId: `u${(index % 8) + 1}`,
            onTime: index % 8 !== 0,
            endedOn: iso(-historyAges[Math.floor(index / 4)]),
            note: 'Returned in great shape',
          },
        ]
      : [],
  tags: [tag, ...tags, category.toLowerCase()],
}))

export const seedState: AppState = {
  stateVersion: 8,
  users: seedUsers,
  resources: seedResources,
  exchanges: [],
  requests: [
    {
      id: 'req1',
      byUserId: 'u8',
      text: 'Need a projector for our literature society screening',
      category: 'Computing',
      neededFrom: iso(3),
      neededTo: iso(3, 4),
      status: 'Open',
      responses: [{ userId: 'u1', resourceId: 'r10', note: 'Happy to help!', at: iso(-1) }],
    },
    {
      id: 'req2',
      byUserId: 'u5',
      text: 'Looking for a badminton racket this weekend',
      category: 'Sports',
      neededFrom: iso(5),
      neededTo: iso(6),
      status: 'Open',
      responses: [],
    },
    {
      id: 'req3',
      byUserId: 'u6',
      text: 'Anyone have a soldering iron for a circuit project?',
      category: 'Lab & Electronics',
      neededFrom: iso(2),
      neededTo: iso(2, 6),
      status: 'Fulfilled',
      responses: [],
    },
  ],
  config: {
    platformFeePercent: 5,
    platformFeeMin: 10,
    platformFeeMax: 150,
    gracePeriodMinutes: 30,
    fineCapMultiplier: 2,
  },
  currentUserId: 'u1',
  simulatedNow: now.toISOString(),
  isAdmin: false,
  session: { loggedIn: true },
}

export const seedExchanges = (): AppState['exchanges'] => {
  const plans = [
    ['r1', 'u2', 'Requested', 1],
    ['r3', 'u1', 'Borrowed', 2],
    ['r5', 'u5', 'Return Due', 1],
    ['r8', 'u6', 'Inspection', 1],
    ['r10', 'u1', 'Settlement', 2],
    ['r22', 'u8', 'Rated', 3],
    ['r28', 'u9', 'Accepted', 1],
    ['r29', 'u1', 'Handover', 1],
  ] as const
  return plans.map(([resourceId, borrowerId, status, units], index) => {
    const resource = seedResources.find((item) => item.id === resourceId) ?? seedResources[0]
    const age = exchangeAges[index]
    const safeBorrowerId =
      borrowerId === resource.ownerId ? (resource.ownerId === 'u1' ? 'u2' : 'u1') : borrowerId
    const startAt = iso(-age)
    const dueAt = status === 'Borrowed' ? iso(2) : iso(-age + units)
    const returnedOn = iso(-age + units)
    const reportBefore = {
      at: startAt,
      by: resource.ownerId,
      overall: 'Good' as const,
      checklist: [
        { label: 'Body and finish', ok: true },
        { label: 'Controls and ports', ok: true },
        { label: 'Accessories', ok: true },
      ],
      photos: [evidencePhoto],
      notes: 'Recorded at handover.',
    }
    const reportAfter = {
      ...reportBefore,
      at: returnedOn,
      photos: [afterEvidencePhoto],
      checklist: [
        { label: 'Body and finish', ok: false, note: 'Small scratch on the body.' },
        { label: 'Controls and ports', ok: true },
        { label: 'Accessories', ok: true },
      ],
      notes: 'Scratch documented during return inspection.',
    }
    const borrowFee = Math.max(resource.minimumCharge, resource.dailyCharge * units)
    const charges = {
      borrowFee,
      platformFee: Math.min(150, Math.max(10, Math.round(borrowFee * 0.05))),
      deposit: resource.deposit,
      lateFee: status === 'Return Due' ? resource.lateFeePerHour * 2 : 0,
      damageDeduction: status === 'Inspection' ? 250 : 0,
    }
    const fines: Fine[] = [
      ...(index === 5
        ? [
            {
              id: `fine-late-ex${index + 1}`,
              reason: 'Late return' as const,
              amount: resource.lateFeePerHour * 2,
              issuedBy: resource.ownerId,
              issuedAt: returnedOn,
              status: 'Settled' as const,
              note: 'Returned two hours after the grace period.',
            },
          ]
        : []),
      ...(index === 3
        ? [
            {
              id: `fine-damage-ex${index + 1}`,
              reason: 'Damage' as const,
              amount: 250,
              issuedBy: resource.ownerId,
              issuedAt: returnedOn,
              status: 'Pending' as const,
              note: 'Scratch documented during return inspection.',
            },
          ]
        : []),
    ]
    const settlement = settleCharges({
      charges,
      lateFeePerHour: resource.lateFeePerHour,
      gracePeriodMinutes: 30,
      dueAt,
      returnedAt: returnedOn,
      fines: activeFinesTotal(fines),
      fineCapMultiplier: 2,
      fineSubtotals: activeFineSubtotals(fines),
    })
    const paymentStatus: Payment['status'] =
      status === 'Settlement' || status === 'Rated'
        ? 'Refunded'
        : ['Handover', 'Borrowed', 'Return Due', 'Returned', 'Inspection'].includes(status)
          ? 'Paid'
          : 'Pending'
    const payment: Payment = {
      status: paymentStatus,
      method: 'Campus Wallet',
      amount: charges.borrowFee + charges.platformFee + charges.deposit,
      txnId: `CC-PAY-${index + 1}`,
      ...(paymentStatus === 'Paid' || paymentStatus === 'Refunded'
        ? { paidAt: startAt }
        : {}),
      ...(paymentStatus === 'Refunded'
        ? {
            refund: {
              amount: settlement.refund,
              txnId: `CC-RFD-ex${index + 1}`,
              at: returnedOn,
            },
          }
        : {}),
    }
    return {
      id: `ex${index + 1}`,
      resourceId,
      ownerId: resource.ownerId,
      borrowerId: safeBorrowerId,
      createdOn: iso(-age - 2),
      status,
      timeline: [
        { status: 'Requested' as const, at: iso(-age - 2) },
        { status, at: startAt },
      ],
      plan: { mode: 'daily' as const, units, startAt, dueAt },
      charges,
      payment,
      purpose: index === 0 ? 'Club content shoot' : 'Campus project',
      dispute:
        status === 'Inspection'
          ? {
              id: 'd1',
              raisedBy: resource.ownerId,
              type: 'Damage' as const,
              description: 'Small scratch found on the body during inspection.',
              evidence: [evidencePhoto, afterEvidencePhoto],
              claimedAmount: 250,
              status: 'Open' as const,
              raisedOn: returnedOn,
            }
          : undefined,
      before: status === 'Inspection' ? reportBefore : undefined,
      after: status === 'Inspection' ? reportAfter : undefined,
      returnedAt:
        status === 'Inspection' || status === 'Settlement' || status === 'Rated'
          ? returnedOn
          : undefined,
      ratingByOwner:
        status === 'Rated'
          ? {
              stars: 1,
              comment: 'The equipment came back damaged and needed repair.',
              at: iso(-1),
              conditionOnReturn: 'Fair',
              tags: ['Returned damaged', 'Poor care'],
            }
          : undefined,
      fines,
    }
  })
}
seedState.exchanges = seedExchanges()
