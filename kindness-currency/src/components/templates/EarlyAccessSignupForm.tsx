'use client'

import { useState } from 'react'
import { signUpForEarlyAccessAction } from '@/app/early-access/actions'
import { ctaCopy } from '@/constants/ctaCopy'

export type EarlyAccessSignupFormProps = {
  templateSlug: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Status = 'form' | 'signedUp' | 'alreadySignedUp'

export function EarlyAccessSignupForm({ templateSlug }: EarlyAccessSignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<Status>('form')

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError(ctaCopy.earlyAccessMissingName)
      return
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(ctaCopy.earlyAccessInvalidEmail)
      return
    }
    setError('')
    setSubmitting(true)
    const result = await signUpForEarlyAccessAction({ name: trimmedName, email: trimmedEmail, templateSlug })
    setSubmitting(false)
    if (result.success) {
      setStatus(result.alreadySignedUp ? 'alreadySignedUp' : 'signedUp')
    } else {
      setError(result.error)
    }
  }

  if (status === 'signedUp') {
    return <div className="mt-5 text-[14.5px] font-semibold text-[#1A1A2E]">{ctaCopy.earlyAccessSuccess}</div>
  }

  if (status === 'alreadySignedUp') {
    return <div className="mt-5 text-[14.5px] font-semibold text-[#1A1A2E]">{ctaCopy.earlyAccessDuplicate}</div>
  }

  return (
    <div className="mt-5 flex flex-col gap-2.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        type="text"
        placeholder={ctaCopy.earlyAccessNamePlaceholder}
        aria-label="Name"
        className="w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder={ctaCopy.earlyAccessEmailPlaceholder}
        aria-label="Email address"
        className="w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
      />
      {error && (
        <div role="alert" className="text-[12.5px] text-[#C2185B]">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-1 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-60"
      >
        {ctaCopy.earlyAccessSubmitButton}
      </button>
    </div>
  )
}
