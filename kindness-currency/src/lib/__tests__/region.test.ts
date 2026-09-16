import { describe, it, expect, vi } from 'vitest'

const cookieStore = { get: vi.fn() }
vi.mock('next/headers', () => ({ cookies: () => Promise.resolve(cookieStore) }))

describe('getRegion', () => {
  it('returns the region stashed in the cookie by src/proxy.ts', async () => {
    cookieStore.get.mockReturnValue({ value: 'ZA' })
    const { getRegion } = await import('../region')

    expect(await getRegion()).toBe('ZA')
  })

  it('falls back to the default region when the cookie is missing (e.g. local dev)', async () => {
    cookieStore.get.mockReturnValue(undefined)
    const { getRegion } = await import('../region')

    expect(await getRegion()).toBe('US')
  })

  it('falls back to the default region rather than trusting a garbage cookie value', async () => {
    cookieStore.get.mockReturnValue({ value: 'not-a-region' })
    const { getRegion } = await import('../region')

    expect(await getRegion()).toBe('US')
  })
})

describe('regionFromCountryCode', () => {
  it('maps ISO country codes to their pricing region, defaulting everyone else to US', async () => {
    const { regionFromCountryCode } = await import('../geoPricing')

    expect(regionFromCountryCode('ZA')).toBe('ZA')
    expect(regionFromCountryCode('GB')).toBe('UK')
    expect(regionFromCountryCode('DE')).toBe('US')
    expect(regionFromCountryCode(null)).toBe('US')
    expect(regionFromCountryCode(undefined)).toBe('US')
  })
})
