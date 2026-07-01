import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgeGate } from '../AgeGate'

describe('AgeGate', () => {
  describe('rendering', () => {
    it("renders the template name in the confirmation copy", () => {
      render(<AgeGate templateName="Lover's Intimate Promises" onConfirm={vi.fn()} onDismiss={vi.fn()} />)
      expect(screen.getByText(/Lover's Intimate Promises contains adult themes/)).toBeInTheDocument()
    })
  })

  describe('"Go Back" path', () => {
    it('calls onDismiss and not onConfirm when the user clicks "Go Back"', async () => {
      const onConfirm = vi.fn()
      const onDismiss = vi.fn()
      render(<AgeGate templateName="Lover's Intimate Promises" onConfirm={onConfirm} onDismiss={onDismiss} />)

      await userEvent.click(screen.getByRole('button', { name: 'Go Back' }))

      expect(onDismiss).toHaveBeenCalledOnce()
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('"I\'m 18+, Continue →" path', () => {
    it('calls onConfirm and not onDismiss when the user confirms', async () => {
      const onConfirm = vi.fn()
      const onDismiss = vi.fn()
      render(<AgeGate templateName="Lover's Intimate Promises" onConfirm={onConfirm} onDismiss={onDismiss} />)

      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

      expect(onConfirm).toHaveBeenCalledOnce()
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })
})
