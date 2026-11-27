import { describe, it, expect } from 'vitest'
import { readDisplayName } from '../displayName'

describe('readDisplayName', () => {
  it('returns the saved name, trimmed', () => {
    expect(readDisplayName({ full_name: '  Alex Rivera ' })).toBe('Alex Rivera')
  })

  it.each([
    ['no metadata', undefined],
    ['no name in it', {}],
    ['an empty name', { full_name: '' }],
    ['only spaces', { full_name: '   ' }],
    ['something that is not text', { full_name: 42 }],
  ])('returns null for %s', (_label, metadata) => {
    expect(readDisplayName(metadata)).toBeNull()
  })
})
