import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isAdminEmail } from '../adminAuth'

describe('isAdminEmail', () => {
  const originalEnv = process.env.ADMIN_EMAILS

  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'owner@example.com, second-admin@example.com'
  })

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalEnv
  })

  it('passes an email on the allowlist', () => {
    expect(isAdminEmail('owner@example.com')).toBe(true)
  })

  it('passes any email on the allowlist, not just the first', () => {
    expect(isAdminEmail('second-admin@example.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isAdminEmail('Owner@Example.com')).toBe(true)
  })

  it('rejects an email not on the allowlist', () => {
    expect(isAdminEmail('stranger@example.com')).toBe(false)
  })

  it('rejects a logged-out visitor (null email)', () => {
    expect(isAdminEmail(null)).toBe(false)
  })

  it('rejects an undefined email', () => {
    expect(isAdminEmail(undefined)).toBe(false)
  })

  it('rejects everyone when ADMIN_EMAILS is unset', () => {
    delete process.env.ADMIN_EMAILS
    expect(isAdminEmail('owner@example.com')).toBe(false)
  })
})
