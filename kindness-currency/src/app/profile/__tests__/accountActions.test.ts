import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateDisplayNameAction } from '../accountActions'

const getUser = vi.fn()
const updateUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser, updateUser } }),
}))

describe('updateDisplayNameAction', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-1' } } })
    updateUser.mockReset().mockResolvedValue({ error: null })
  })

  it('refuses when nobody is signed in, and changes nothing', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const result = await updateDisplayNameAction('Alex')

    expect(result).toEqual({ success: false, error: 'Not logged in' })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('saves the trimmed name on the signed-in person, and returns it', async () => {
    const result = await updateDisplayNameAction('  Alex Rivera  ')

    expect(updateUser).toHaveBeenCalledWith({ data: { full_name: 'Alex Rivera' } })
    expect(result).toEqual({ success: true, name: 'Alex Rivera' })
  })

  it.each([
    ['empty', ''],
    ['only spaces', '   '],
  ])('rejects a name that is %s', async (_label, input) => {
    const result = await updateDisplayNameAction(input)

    expect(result).toEqual({ success: false, error: 'Enter your name ♥' })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('rejects a name longer than 60 characters', async () => {
    const result = await updateDisplayNameAction('a'.repeat(61))

    expect(result).toEqual({ success: false, error: 'Names can be up to 60 characters.' })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('accepts a name of exactly 60 characters', async () => {
    const result = await updateDisplayNameAction('a'.repeat(60))

    expect(result).toEqual({ success: true, name: 'a'.repeat(60) })
  })

  it('reports a soft error if saving fails', async () => {
    updateUser.mockResolvedValue({ error: { message: 'boom' } })

    const result = await updateDisplayNameAction('Alex')

    expect(result).toEqual({ success: false, error: 'Something went wrong saving your name. Please try again.' })
  })
})
