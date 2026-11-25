import { describe, it, expect, vi } from 'vitest'
import { createDiscountCodeRepository } from '../discountCodeRepository'
import { DISCOUNT_ERRORS } from '../discount'

type CodeRow = {
  id: string
  code: string
  percent_off: number
  label: string
  max_redemptions: number | null
  expires_at: string | null
  is_active: boolean
}

const baseRow: CodeRow = {
  id: 'code-1',
  code: 'TESTER',
  percent_off: 100,
  label: 'tester',
  max_redemptions: null,
  expires_at: null,
  is_active: true,
}

/** Fake Supabase: one code lookup, then "has this user used it" and "how many have used it". */
function makeSupabase({ row, mine = null, used = 0 }: { row: CodeRow | null; mine?: { id: string } | null; used?: number }) {
  const codeEq = vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) })
  const mineMaybeSingle = vi.fn().mockResolvedValue({ data: mine, error: null })
  const countEq = vi.fn().mockResolvedValue({ count: used, error: null })

  const from = vi.fn((table: string) => {
    if (table === 'discount_codes') return { select: vi.fn().mockReturnValue({ eq: codeEq }) }
    if (table === 'discount_redemptions') {
      return {
        select: vi.fn((_cols: string, opts?: { head?: boolean }) =>
          opts?.head
            ? { eq: countEq }
            : { eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: mineMaybeSingle }) }) }
        ),
      }
    }
    throw new Error(`unexpected table: ${table}`)
  })
  return { from, codeEq }
}

describe('DiscountCodeRepository.validateForUser', () => {
  it('accepts a live code, looking it up case-insensitively and ignoring stray spaces', async () => {
    const supabase = makeSupabase({ row: baseRow })
    const repo = createDiscountCodeRepository(supabase as never)

    const result = await repo.validateForUser('  tester ', 'user-1')

    expect(supabase.codeEq).toHaveBeenCalledWith('code', 'TESTER')
    expect(result).toEqual({ success: true, code: { id: 'code-1', code: 'TESTER', percentOff: 100, label: 'tester' } })
  })

  it('refuses an unknown code', async () => {
    const repo = createDiscountCodeRepository(makeSupabase({ row: null }) as never)
    expect(await repo.validateForUser('NOPE', 'user-1')).toEqual({ success: false, error: DISCOUNT_ERRORS.notFound })
  })

  it('refuses an empty code without querying', async () => {
    const supabase = makeSupabase({ row: baseRow })
    const repo = createDiscountCodeRepository(supabase as never)

    expect(await repo.validateForUser('   ', 'user-1')).toEqual({ success: false, error: DISCOUNT_ERRORS.notFound })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('refuses a deactivated code', async () => {
    const repo = createDiscountCodeRepository(makeSupabase({ row: { ...baseRow, is_active: false } }) as never)
    expect(await repo.validateForUser('TESTER', 'user-1')).toEqual({ success: false, error: DISCOUNT_ERRORS.inactive })
  })

  it('refuses an expired code but accepts one that has not expired yet', async () => {
    const expired = createDiscountCodeRepository(makeSupabase({ row: { ...baseRow, expires_at: '2020-01-01T00:00:00Z' } }) as never)
    const future = createDiscountCodeRepository(makeSupabase({ row: { ...baseRow, expires_at: '2999-01-01T00:00:00Z' } }) as never)

    expect(await expired.validateForUser('TESTER', 'user-1')).toEqual({ success: false, error: DISCOUNT_ERRORS.expired })
    expect((await future.validateForUser('TESTER', 'user-1')).success).toBe(true)
  })

  it('refuses a code this person has already used', async () => {
    const repo = createDiscountCodeRepository(makeSupabase({ row: baseRow, mine: { id: 'r1' } }) as never)
    expect(await repo.validateForUser('TESTER', 'user-1')).toEqual({ success: false, error: DISCOUNT_ERRORS.alreadyUsed })
  })

  it('refuses a code that has reached its maximum redemptions', async () => {
    const repo = createDiscountCodeRepository(makeSupabase({ row: { ...baseRow, max_redemptions: 10 }, used: 10 }) as never)
    expect(await repo.validateForUser('TESTER', 'user-1')).toEqual({ success: false, error: DISCOUNT_ERRORS.exhausted })
  })

  it('accepts a limited code that still has uses left', async () => {
    const repo = createDiscountCodeRepository(makeSupabase({ row: { ...baseRow, max_redemptions: 10 }, used: 9 }) as never)
    expect((await repo.validateForUser('TESTER', 'user-1')).success).toBe(true)
  })
})
