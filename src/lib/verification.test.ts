import { describe, expect, it } from 'vitest'
import { seedResources, seedState, seedUsers } from '../data/seed'
import type { AppState, Exchange } from '../data/types'
import { reducer } from '../store/AppStore'
import {
  allChecksPassed,
  isFullyVerified,
  isPubliclyListed,
  ownerVerificationLevel,
  STANDARD_CHECKS,
} from './verification'

const adminState = (): AppState => ({
  ...structuredClone(seedState),
  isAdmin: true,
  currentUserId: 'u2',
})
const submitted = () =>
  seedResources.find((resource) => resource.verification.status === 'Submitted')!
const passedChecks = STANDARD_CHECKS.map((label) => ({ label, passed: true }))

describe('verification helpers', () => {
  it('derives the owner verification level from the three campus checks', () => {
    expect(
      ownerVerificationLevel({
        identityVerified: true,
        campusVerified: true,
        contactVerified: true,
        level: 'Unverified',
      }),
    ).toBe('Fully Verified')
    expect(
      ownerVerificationLevel({
        identityVerified: true,
        campusVerified: false,
        contactVerified: false,
        level: 'Unverified',
      }),
    ).toBe('Basic')
    expect(
      ownerVerificationLevel({
        identityVerified: false,
        campusVerified: false,
        contactVerified: false,
        level: 'Fully Verified',
      }),
    ).toBe('Unverified')
  })

  it('keeps seeded users consistent between the verified flag and the level', () => {
    expect(
      seedUsers.every(
        (user) => user.verified === (ownerVerificationLevel(user.verification) === 'Fully Verified'),
      ),
    ).toBe(true)
  })

  it('only lists resources that passed inspection and approval', () => {
    const resource = seedResources[0]
    expect(isPubliclyListed(resource)).toBe(true)
    expect(
      isPubliclyListed({
        ...resource,
        verification: { ...resource.verification, status: 'Submitted' },
      }),
    ).toBe(false)
    expect(isPubliclyListed({ ...resource, approvalStatus: 'Pending' })).toBe(false)
    expect(isPubliclyListed({ ...resource, removed: true })).toBe(false)
  })

  it('reports full verification only when the owner is fully verified too', () => {
    const resource = seedResources[0]
    const owner = seedUsers.find((user) => user.id === resource.ownerId)!
    const basicOwner = seedUsers.find(
      (user) => ownerVerificationLevel(user.verification) !== 'Fully Verified',
    )!
    expect(isFullyVerified(resource, owner)).toBe(true)
    expect(isFullyVerified(resource, basicOwner)).toBe(false)
  })

  it('requires a non-empty, fully passed checklist', () => {
    expect(allChecksPassed([])).toBe(false)
    expect(allChecksPassed(passedChecks)).toBe(true)
    expect(allChecksPassed([...passedChecks, { label: 'Extra', passed: false }])).toBe(false)
  })
})

describe('admin verification queue', () => {
  it('starts an inspection only for an admin', () => {
    const state = adminState()
    const target = submitted().id
    const started = reducer(state, { type: 'startInspection', resourceId: target })
    expect(
      started.resources.find((resource) => resource.id === target)?.verification.status,
    ).toBe('Under Inspection')
    const asMember = reducer(
      { ...state, isAdmin: false },
      { type: 'startInspection', resourceId: target },
    )
    expect(asMember.resources).toEqual(state.resources)
  })

  it('publishes a resource only when every equipment check passes', () => {
    const state = adminState()
    const target = submitted().id
    const inspecting = reducer(state, { type: 'startInspection', resourceId: target })
    const refused = reducer(state, {
      type: 'verifyResource',
      resourceId: target,
      checks: STANDARD_CHECKS.map((label, index) => ({ label, passed: index !== 0 })),
      verifiedCondition: 'Good',
    })
    expect(refused).toBe(state)
    const refusedDuringInspection = reducer(inspecting, {
      type: 'verifyResource',
      resourceId: target,
      checks: STANDARD_CHECKS.map((label, index) => ({ label, passed: index !== 0 })),
      verifiedCondition: 'Good',
    })
    expect(refusedDuringInspection).toBe(inspecting)
    const verified = reducer(inspecting, {
      type: 'verifyResource',
      resourceId: target,
      checks: passedChecks,
      verifiedCondition: 'Like New',
      note: 'All accessories present.',
    })
    const resource = verified.resources.find((item) => item.id === target)!
    expect(resource.verification.status).toBe('Verified')
    expect(resource.verification.verifierId).toBe('u2')
    expect(resource.verification.inspectedAt).toBe(state.simulatedNow)
    expect(resource.verification.verifiedCondition).toBe('Like New')
    expect(resource.approvalStatus).toBe('Approved')
    expect(isPubliclyListed(resource)).toBe(true)
  })

  it('records a rejection with the failed check and keeps the item unlisted', () => {
    const state = adminState()
    const target = submitted().id
    const failing = STANDARD_CHECKS.map((label, index) => ({ label, passed: index !== 2 }))
    const rejected = reducer(state, {
      type: 'rejectResource',
      resourceId: target,
      note: 'Did not power on.',
      checks: failing,
    })
    const resource = rejected.resources.find((item) => item.id === target)!
    expect(resource.verification.status).toBe('Rejected')
    expect(resource.approvalStatus).toBe('Rejected')
    expect(resource.verification.note).toBe('Did not power on.')
    expect(isPubliclyListed(resource)).toBe(false)
    const asMember = { ...state, isAdmin: false }
    expect(
      reducer(asMember, { type: 'rejectResource', resourceId: target, note: 'x' }),
    ).toBe(asMember)
  })

  it('refuses to create an exchange against an unverified resource', () => {
    const state = structuredClone(seedState)
    const unverified = submitted()
    const template = state.exchanges[0]
    const draft = (resourceId: string): Exchange => ({
      ...structuredClone(template),
      id: `ex-new-${resourceId}`,
      resourceId,
      status: 'Requested',
    })
    expect(reducer(state, { type: 'createExchange', exchange: draft(unverified.id) })).toBe(state)
    const created = reducer(state, { type: 'createExchange', exchange: draft('r1') })
    expect(created.exchanges).toHaveLength(state.exchanges.length + 1)
  })
})
