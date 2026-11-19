import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecipientAgeGate } from '../RecipientAgeGate'

const { refresh, confirmRecipientAgeAction } = vi.hoisted(() => ({
  refresh: vi.fn(),
  confirmRecipientAgeAction: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('@/app/give/[id]/actions', () => ({ confirmRecipientAgeAction }))

describe('RecipientAgeGate', () => {
  it('confirming sets the cookie via the server action, then refreshes to load the gift', async () => {
    render(<RecipientAgeGate setId="set-1" />)

    await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(confirmRecipientAgeAction).toHaveBeenCalledWith('set-1')
  })

  it('declining shows the adults-only screen and does not set the cookie', async () => {
    confirmRecipientAgeAction.mockClear()
    render(<RecipientAgeGate setId="set-1" />)

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }))

    expect(screen.getByText('This gift is for adults')).toBeInTheDocument()
    expect(confirmRecipientAgeAction).not.toHaveBeenCalled()
  })
})
