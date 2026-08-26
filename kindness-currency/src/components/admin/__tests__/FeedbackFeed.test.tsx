import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackFeed } from '../FeedbackFeed'
import type { FeedbackEntry } from '@/lib/feedbackRepository'

const entries: FeedbackEntry[] = [
  { id: 'f1', type: 'bug', message: 'It crashed', email: 'jamie@example.com', createdAt: '2026-08-20T00:00:00Z' },
  { id: 'f2', type: 'bug', message: 'Also crashed', email: null, createdAt: '2026-08-19T00:00:00Z' },
  { id: 'f3', type: 'suggestion', message: 'Add dark mode', email: 'alex@example.com', createdAt: '2026-08-18T00:00:00Z' },
]

describe('FeedbackFeed', () => {
  it('shows a count per type', () => {
    render(<FeedbackFeed entries={entries} />)

    expect(screen.getByText('Bug')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Suggestion')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows every entry when "All" is selected by default', () => {
    render(<FeedbackFeed entries={entries} />)

    expect(screen.getByText('It crashed')).toBeInTheDocument()
    expect(screen.getByText('Also crashed')).toBeInTheDocument()
    expect(screen.getByText('Add dark mode')).toBeInTheDocument()
  })

  it('filters the list to only the selected type', async () => {
    render(<FeedbackFeed entries={entries} />)

    await userEvent.click(screen.getByRole('radio', { name: /Suggestion/ }))

    expect(screen.getByText('Add dark mode')).toBeInTheDocument()
    expect(screen.queryByText('It crashed')).not.toBeInTheDocument()
    expect(screen.queryByText('Also crashed')).not.toBeInTheDocument()
  })

  it('shows a type-specific empty state when a filter matches nothing', async () => {
    render(<FeedbackFeed entries={entries} />)

    await userEvent.click(screen.getByRole('radio', { name: /Question/ }))

    expect(screen.getByText('No feedback of this type yet.')).toBeInTheDocument()
  })

  it('shows a "no email on file" placeholder for entries without a resolvable email', () => {
    render(<FeedbackFeed entries={entries} />)

    expect(screen.getByText('No email on file')).toBeInTheDocument()
  })

  it('shows Thank and Follow Up mailto links for an entry with an email', () => {
    render(<FeedbackFeed entries={[entries[0]]} />)

    const thankLink = screen.getByRole('link', { name: 'Thank' })
    const followUpLink = screen.getByRole('link', { name: 'Follow Up' })

    expect(thankLink).toHaveAttribute('href', expect.stringContaining('mailto:jamie@example.com?'))
    expect(followUpLink).toHaveAttribute('href', expect.stringContaining('mailto:jamie@example.com?'))
    expect(decodeURIComponent(thankLink.getAttribute('href') ?? '')).toContain('It crashed')
  })

  it('does not show Thank/Follow Up links for an entry with no email', () => {
    render(<FeedbackFeed entries={[entries[1]]} />)

    expect(screen.queryByRole('link', { name: 'Thank' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Follow Up' })).not.toBeInTheDocument()
  })

  it('shows the general empty state when there is no feedback at all', () => {
    render(<FeedbackFeed entries={[]} />)

    expect(screen.getByText('No feedback yet.')).toBeInTheDocument()
  })
})
