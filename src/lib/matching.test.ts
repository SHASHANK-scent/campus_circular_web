import { describe, expect, it } from 'vitest'
import { matchIntent, parseIntent } from './matching'
import { seedResources, seedUsers } from '../data/seed'
describe('matching engine', () => {
  it('parses the reel prompt into a one-day window and kit slots', () => {
    const current = new Date('2025-03-15T10:00:00.000Z')
    const intent = parseIntent('I need to make a reel for my club event tomorrow', current)
    expect(intent.tags).toEqual(expect.arrayContaining(['camera', 'tripod', 'microphone', 'light']))
    expect(intent.mode).toBe('daily')
    expect(intent.units).toBe(1)
    expect(new Date(intent.dueAt).getTime() - new Date(intent.startAt).getTime()).toBe(86400000)
    expect(matchIntent(intent, seedResources, seedUsers).map((slot) => slot.tag)).toEqual(expect.arrayContaining(['camera', 'tripod', 'microphone', 'light']))
  })
})
