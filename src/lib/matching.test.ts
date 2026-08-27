import { describe, expect, it } from 'vitest'
import { matchIntent, parseIntent } from './matching'
import { seedResources, seedState, seedUsers } from '../data/seed'
describe('matching engine', () => {
  it('parses the reel prompt into a one-day window and kit slots', () => {
    const current = new Date('2025-03-15T10:00:00.000Z')
    const intent = parseIntent('I need to make a reel for my club event tomorrow', current)
    expect(intent.tags).toEqual(expect.arrayContaining(['camera', 'tripod', 'microphone', 'light']))
    expect(intent.mode).toBe('daily')
    expect(intent.units).toBe(1)
    expect(new Date(intent.dueAt).getTime() - new Date(intent.startAt).getTime()).toBe(86400000)
    const kit = matchIntent(intent, seedResources, seedUsers, seedState.config)
    expect(kit.map((slot) => slot.tag)).toEqual(
      expect.arrayContaining(['camera', 'tripod', 'microphone', 'lighting']),
    )
    const primaryResources = kit.slice(0, 5).map((slot) => slot.recommendation?.resource)
    expect(primaryResources[0]?.tags[0]).toBe('camera')
    expect(primaryResources[0]?.id).not.toBe('r3')
    expect(primaryResources[1]?.id).toBe('r3')
    expect(primaryResources[2]?.tags[0]).toBe('microphone')
    expect(primaryResources[3]?.tags[0]).toBe('light')
    const recommendedIds = kit
      .map((slot) => slot.recommendation?.resource.id)
      .filter((id): id is string => Boolean(id))
    expect(new Set(recommendedIds).size).toBe(recommendedIds.length)
  })

  it('does not use a category-only near miss for a slot', () => {
    const intent = parseIntent('I need a reel tomorrow', new Date('2025-03-15T10:00:00.000Z'))
    const tripodOnly = seedResources.find((resource) => resource.id === 'r3')
    expect(tripodOnly).toBeDefined()
    const kit = matchIntent(intent, [tripodOnly!], seedUsers, seedState.config)
    expect(kit.find((slot) => slot.tag === 'camera')?.recommendation).toBeUndefined()
  })
})
