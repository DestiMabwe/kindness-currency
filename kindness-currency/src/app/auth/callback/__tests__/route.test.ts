import { describe, it, expect } from 'vitest'
import { isSafeRedirectPath } from '../route'

describe('isSafeRedirectPath', () => {
  it('accepts a plain relative path', () => {
    expect(isSafeRedirectPath('/give/set-1')).toBe(true)
  })

  it('accepts the root path', () => {
    expect(isSafeRedirectPath('/')).toBe(true)
  })

  it('rejects null (no next param)', () => {
    expect(isSafeRedirectPath(null)).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isSafeRedirectPath('')).toBe(false)
  })

  it('rejects a protocol-relative path (open-redirect vector)', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false)
  })

  it('rejects an absolute URL to another origin', () => {
    expect(isSafeRedirectPath('https://evil.com')).toBe(false)
  })

  it('rejects a path with no leading slash', () => {
    expect(isSafeRedirectPath('create')).toBe(false)
  })
})
