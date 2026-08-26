import { describe, it, expect } from 'vitest'
import { buildFollowUpMailto, buildThankYouMailto } from '../feedbackEmailTemplates'

describe('feedbackEmailTemplates', () => {
  describe('buildThankYouMailto', () => {
    it('addresses the mailto link to the given email', () => {
      const link = buildThankYouMailto('jamie@example.com', { type: 'bug', message: 'It crashed' })

      expect(link.startsWith('mailto:jamie@example.com?')).toBe(true)
    })

    it('includes the original message, quoted, in the body', () => {
      const link = buildThankYouMailto('jamie@example.com', { type: 'suggestion', message: 'Add dark mode' })

      expect(decodeURIComponent(link)).toContain('"Add dark mode"')
    })

    it('does not vary its subject by feedback type', () => {
      const bugLink = buildThankYouMailto('jamie@example.com', { type: 'bug', message: 'x' })
      const suggestionLink = buildThankYouMailto('jamie@example.com', { type: 'suggestion', message: 'x' })

      const subjectOf = (link: string) => new URL(link).searchParams.get('subject')
      expect(subjectOf(bugLink)).toBe(subjectOf(suggestionLink))
    })
  })

  describe('buildFollowUpMailto', () => {
    it('addresses the mailto link to the given email', () => {
      const link = buildFollowUpMailto('jamie@example.com', { type: 'question', message: 'How do I redeem?' })

      expect(link.startsWith('mailto:jamie@example.com?')).toBe(true)
    })

    it('includes the original message, quoted, in the body', () => {
      const link = buildFollowUpMailto('jamie@example.com', { type: 'question', message: 'How do I redeem?' })

      expect(decodeURIComponent(link)).toContain('"How do I redeem?"')
    })

    it('tailors the follow-up line by feedback type', () => {
      const bugBody = decodeURIComponent(buildFollowUpMailto('jamie@example.com', { type: 'bug', message: 'x' }))
      const suggestionBody = decodeURIComponent(buildFollowUpMailto('jamie@example.com', { type: 'suggestion', message: 'x' }))

      expect(bugBody).toContain('steps to reproduce')
      expect(suggestionBody).toContain("we're considering it")
      expect(bugBody).not.toBe(suggestionBody)
    })
  })
})
