import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftLetterStrip } from '../GiftLetterStrip'

const MESSAGE = 'Thinking of you every day. Use these whenever life gets loud.'

describe('GiftLetterStrip', () => {
  it('shows who the note is from with a teaser of the message', () => {
    render(<GiftLetterStrip senderName="Alex" senderMessage={MESSAGE} accent="#C2185B" />)

    expect(screen.getByRole('button', { name: /A note from Alex/ })).toHaveTextContent('Thinking of you every day.')
  })

  it('opens the full message when tapped', async () => {
    render(<GiftLetterStrip senderName="Alex" senderMessage={MESSAGE} accent="#C2185B" />)

    await userEvent.click(screen.getByRole('button', { name: /A note from Alex/ }))

    expect(screen.getByRole('dialog', { name: 'A gift from Alex' })).toHaveTextContent('Use these whenever life gets loud.')
  })

  it('renders nothing when the sender left no message', () => {
    const { container } = render(<GiftLetterStrip senderName="Alex" senderMessage={null} accent="#C2185B" />)

    expect(container).toBeEmptyDOMElement()
  })
})
