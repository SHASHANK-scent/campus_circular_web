import { describe, expect, it } from 'vitest'
import { resourcePhotos } from '../data/photos'
import { getResourceGradient, getResourceImageSource } from './ResourceImage'

describe('ResourceImage draft support', () => {
  it('chooses a safe gradient for an empty draft resource', () => {
    expect(getResourceGradient({})).toBe('from-emerald-100 via-teal-50 to-slate-100')
  })
})

describe('ResourceImage photo handling', () => {
  it('uses the seeded photo when one is present', () => {
    expect(getResourceImageSource({ id: 'r1' })).toBe(resourcePhotos.r1)
  })

  it('prefers the mapped photo over a user-uploaded image', () => {
    expect(getResourceImageSource({ id: 'r1', images: ['data:image/jpeg;base64,old'] })).toBe(
      resourcePhotos.r1,
    )
  })

  it('returns no source when a resource has no photo', () => {
    expect(getResourceImageSource({})).toBeUndefined()
  })

  it('uses a user-uploaded image when no seeded photo exists', () => {
    expect(getResourceImageSource({ images: ['data:image/jpeg;base64,photo'] })).toBe(
      'data:image/jpeg;base64,photo',
    )
  })

  it('returns the placeholder state after a photo load error', () => {
    expect(getResourceImageSource({ id: 'r1' }, true)).toBeUndefined()
  })
})
