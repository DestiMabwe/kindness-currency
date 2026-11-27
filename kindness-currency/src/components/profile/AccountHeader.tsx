'use client'

import { useState } from 'react'
import { DISPLAY_NAME_MAX_LENGTH } from '@/schemas/accountSchema'
import type { UpdateDisplayNameResult } from '@/app/profile/accountActions'

export type AccountHeaderProps = {
  /** The saved display name, or null if this person never gave one. */
  name: string | null
  email: string
  onSave: (name: string) => Promise<UpdateDisplayNameResult>
}

// Top of My Account: who is signed in, and a way to say what to call them. With no name saved it
// opens straight on the question, but never blocks the rest of the page.
export function AccountHeader({ name: initialName, email, onSave }: AccountHeaderProps) {
  const [name, setName] = useState(initialName)
  const [editing, setEditing] = useState(!initialName)
  const [draft, setDraft] = useState(initialName ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    const result = await onSave(draft)
    setSaving(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setName(result.name)
    setDraft(result.name)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(name ?? '')
    setError('')
    setEditing(false)
  }

  return (
    <div className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
      {editing ? (
        <div>
          {!name && <div className="mb-2 text-[15.5px] font-bold text-[#1A1A2E]">What should we call you?</div>}
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError('')
            }}
            maxLength={DISPLAY_NAME_MAX_LENGTH + 1}
            aria-label="Your name"
            placeholder="Your name"
            className="w-full rounded-[14px] border-[1.5px] border-[#1A1A2E]/14 bg-white p-3 text-[15px] text-[#1A1A2E] outline-none"
          />
          {error && (
            <div role="alert" className="mt-2 text-[12.5px] text-[#C2185B]">
              {error}
            </div>
          )}
          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-2xl bg-[#C2185B] px-5 py-2.5 font-sans text-sm font-bold text-white disabled:opacity-50"
            >
              Save
            </button>
            {name && (
              <button
                type="button"
                onClick={cancel}
                disabled={saving}
                className="rounded-2xl px-4 py-2.5 font-sans text-sm font-bold text-[#1A1A2E] disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="text-[18px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            {`Hi, ${name}`}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[13px] font-bold text-[#C2185B] underline"
          >
            Edit name
          </button>
        </div>
      )}
      <div className="mt-2.5 text-[12px] tracking-[0.03em] text-[#2C2C2C] opacity-70">Signed in as</div>
      <div className="text-[14px] font-semibold break-all text-[#1A1A2E]">{email}</div>
    </div>
  )
}
