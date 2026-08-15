'use client'

import { useState } from 'react'
import { submitFeedbackAction } from '@/app/feedback/actions'
import { ctaCopy } from '@/constants/ctaCopy'

export type FeedbackFormProps = {
  isLoggedIn: boolean
}

export function FeedbackForm({ isLoggedIn }: FeedbackFormProps) {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please share a few words first ♥')
      return
    }
    setSubmitting(true)
    setError('')
    const result = await submitFeedbackAction({ message, email: email.trim() || undefined })
    setSubmitting(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return <div className="mt-6 text-[14.5px] font-semibold text-[#1A1A2E]">{ctaCopy.feedbackThankYou}</div>
  }

  return (
    <div className="mt-6 flex flex-col gap-2.5">
      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          setError('')
        }}
        placeholder="What's on your mind?"
        aria-label="Feedback message"
        rows={5}
        className="w-full resize-none rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
      />
      {!isLoggedIn && (
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email (optional)"
          aria-label="Email address"
          className="w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
        />
      )}
      {error && (
        <div role="alert" className="text-[12.5px] text-[#C2185B]">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-1.5 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-60"
      >
        {ctaCopy.feedbackSubmitButton}
      </button>
    </div>
  )
}
