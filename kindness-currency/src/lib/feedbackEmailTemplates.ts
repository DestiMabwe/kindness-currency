import type { FeedbackType } from '@/schemas/feedbackSchema'

export type FeedbackEmailContext = { type: FeedbackType; message: string }

function buildMailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildThankYouMailto(email: string, context: FeedbackEmailContext): string {
  const body = [
    'Hi,',
    '',
    'Thank you for taking the time to share this with us:',
    '',
    `"${context.message}"`,
    '',
    'It means a lot — feedback like yours helps us make Kindness Currency better.',
    '',
    '— The Kindness Currency team',
  ].join('\n')

  return buildMailtoLink(email, 'Thanks for your feedback ♥', body)
}

const FOLLOW_UP_LINES: Record<FeedbackType, string> = {
  bug: 'We wanted to follow up and see if you could share a few more details (device, browser, steps to reproduce) so we can track it down faster.',
  suggestion: "We wanted to follow up and let you know we're considering it — would love to hear more about what prompted it, if you have a moment.",
  question: "Wanted to follow up and make sure this got answered — let us know if you're still looking for more info.",
  other: "Just following up to see if there's anything else we can help with.",
}

export function buildFollowUpMailto(email: string, context: FeedbackEmailContext): string {
  const body = [
    'Hi,',
    '',
    'Thanks again for this:',
    '',
    `"${context.message}"`,
    '',
    FOLLOW_UP_LINES[context.type],
    '',
    '— The Kindness Currency team',
  ].join('\n')

  return buildMailtoLink(email, 'Following up on your feedback', body)
}
