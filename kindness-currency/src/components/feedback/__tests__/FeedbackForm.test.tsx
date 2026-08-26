import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackForm } from '../FeedbackForm'

const submitFeedbackAction = vi.fn()
vi.mock('@/app/feedback/actions', () => ({
  submitFeedbackAction: (input: unknown) => submitFeedbackAction(input),
}))

beforeEach(() => {
  submitFeedbackAction.mockReset()
})

describe('FeedbackForm', () => {
  it('blocks submission and shows an inline error when no type is chosen', async () => {
    render(<FeedbackForm isLoggedIn={false} />)

    await userEvent.type(screen.getByLabelText('Feedback message'), 'Something broke')
    await userEvent.click(screen.getByRole('button', { name: 'Send Feedback' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/choose a feedback type/i)
    expect(submitFeedbackAction).not.toHaveBeenCalled()
  })

  it('blocks submission when the message is empty, even with a type chosen', async () => {
    render(<FeedbackForm isLoggedIn={false} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Bug' }))
    await userEvent.click(screen.getByRole('button', { name: 'Send Feedback' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/share a few words/i)
    expect(submitFeedbackAction).not.toHaveBeenCalled()
  })

  it('marks the chosen type pill as checked and the others as not', async () => {
    render(<FeedbackForm isLoggedIn={false} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Bug' }))

    expect(screen.getByRole('radio', { name: 'Bug' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Suggestion' })).toHaveAttribute('aria-checked', 'false')
  })

  it('submits the selected type along with the message', async () => {
    submitFeedbackAction.mockResolvedValue({ success: true })
    render(<FeedbackForm isLoggedIn={false} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Suggestion' }))
    await userEvent.type(screen.getByLabelText('Feedback message'), 'Add dark mode')
    await userEvent.click(screen.getByRole('button', { name: 'Send Feedback' }))

    expect(submitFeedbackAction).toHaveBeenCalledWith({ type: 'suggestion', message: 'Add dark mode', email: undefined })
  })

  it('shows the thank-you message after a successful submission', async () => {
    submitFeedbackAction.mockResolvedValue({ success: true })
    render(<FeedbackForm isLoggedIn={false} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Question' }))
    await userEvent.type(screen.getByLabelText('Feedback message'), 'How do I redeem?')
    await userEvent.click(screen.getByRole('button', { name: 'Send Feedback' }))

    expect(await screen.findByText('Thank you for helping us grow ♥')).toBeInTheDocument()
  })
})
