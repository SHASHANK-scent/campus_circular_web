import { describe, expect, it } from 'vitest'
import { getResourceGradient } from './ResourceImage'

describe('ResourceImage draft support', () => {
  it('chooses a safe gradient for an empty draft resource', () => {
    expect(getResourceGradient({})).toBe('from-emerald-100 via-teal-50 to-slate-100')
  })
})
