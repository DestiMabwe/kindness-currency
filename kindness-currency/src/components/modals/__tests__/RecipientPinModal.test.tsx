import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecipientPinModal } from '../RecipientPinModal'

const live = (pin = '4821', ttlMs = 5 * 60 * 1000) => ({
  success: true as const,
  pin,
  expiresAt: new Date(Date.now() + ttlMs).toISOString(),
})

function setup(overrides: { onGenerate?: Mock; onPollStatus?: Mock } = {}) {
  const onGenerate = overrides.onGenerate ?? vi.fn().mockResolvedValue(live())
  const onPollStatus = overrides.onPollStatus ?? vi.fn().mockResolvedValue('sent')
  const onRedeemed = vi.fn()
  const onClose = vi.fn()
  render(
    <RecipientPinModal
      couponTitle="One Massage"
      senderName="Jordan"
      onGenerate={onGenerate}
      onPollStatus={onPollStatus}
      onRedeemed={onRedeemed}
      onClose={onClose}
    />
  )
  return { onGenerate, onPollStatus, onRedeemed, onClose }
}

describe('RecipientPinModal', () => {
  describe('before generating', () => {
    it('explains what the PIN is for and shows no PIN yet', () => {
      setup()
      expect(screen.getByRole('button', { name: 'Generate Redemption PIN' })).toBeInTheDocument()
      expect(screen.getByText(/One Massage/)).toBeInTheDocument()
      expect(screen.queryByLabelText('Your PIN')).not.toBeInTheDocument()
    })
  })

  describe('generating', () => {
    it('shows the 4 digits and the countdown after tapping Generate Redemption PIN', async () => {
      const props = setup()

      await userEvent.click(screen.getByRole('button', { name: 'Generate Redemption PIN' }))

      expect(props.onGenerate).toHaveBeenCalledTimes(1)
      expect(await screen.findByLabelText('Your PIN')).toHaveTextContent('4821')
      expect(screen.getByText('Tell Jordan this PIN — it works for 5 minutes.')).toBeInTheDocument()
      expect(screen.getByRole('timer')).toHaveTextContent(/Expires in [45]:\d\d/)
    })

    it('shows the soft error and stays on the intro when generating fails (e.g. rate limited)', async () => {
      setup({ onGenerate: vi.fn().mockResolvedValue({ success: false, error: 'Easy there — please wait.' }) })

      await userEvent.click(screen.getByRole('button', { name: 'Generate Redemption PIN' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Easy there — please wait.')
      expect(screen.queryByLabelText('Your PIN')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Generate Redemption PIN' })).toBeInTheDocument()
    })
  })

  describe('while the PIN is showing', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
    afterEach(() => vi.useRealTimers())

    it('polls the coupon status every 3 seconds and fires onRedeemed once the sender confirms', async () => {
      const onPollStatus = vi.fn().mockResolvedValueOnce('sent').mockResolvedValue('redeemed')
      const props = setup({ onPollStatus })
      await userEvent.click(screen.getByRole('button', { name: 'Generate Redemption PIN' }))
      await screen.findByLabelText('Your PIN')

      await act(() => vi.advanceTimersByTimeAsync(3000))
      expect(onPollStatus).toHaveBeenCalledTimes(1)
      expect(props.onRedeemed).not.toHaveBeenCalled()

      await act(() => vi.advanceTimersByTimeAsync(3000))
      expect(props.onRedeemed).toHaveBeenCalledTimes(1)
    })

    it('does not poll before a PIN has been generated', async () => {
      const props = setup()

      await act(() => vi.advanceTimersByTimeAsync(10_000))

      expect(props.onPollStatus).not.toHaveBeenCalled()
    })

    it('expires after 5 minutes, hides the PIN, and offers to generate a new one', async () => {
      const props = setup({ onGenerate: vi.fn().mockResolvedValue(live('4821', 5000)) })
      await userEvent.click(screen.getByRole('button', { name: 'Generate Redemption PIN' }))
      await screen.findByLabelText('Your PIN')

      await act(() => vi.advanceTimersByTimeAsync(6000))

      expect(screen.queryByLabelText('Your PIN')).not.toBeInTheDocument()
      expect(screen.getByText('That PIN has expired.')).toBeInTheDocument()
      const pollsAtExpiry = props.onPollStatus.mock.calls.length
      await act(() => vi.advanceTimersByTimeAsync(9000))
      expect(props.onPollStatus.mock.calls.length).toBe(pollsAtExpiry) // polling stops with the PIN

      props.onGenerate.mockResolvedValue(live('7777'))
      await userEvent.click(screen.getByRole('button', { name: 'Generate a New PIN' }))
      expect(await screen.findByLabelText('Your PIN')).toHaveTextContent('7777')
    })
  })
})
