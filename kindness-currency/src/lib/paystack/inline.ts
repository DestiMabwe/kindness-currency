'use client'

// Client-side counterpart to paystack/client.ts's initializeTransaction: resumes a transaction
// that was already initialized server-side (with the secret key, which locks in the
// server-computed amount) using only its access code — Paystack's documented secure pattern for
// InlineJS v2 ("initialize on your server, then resume on the client"). No public key needed here,
// so nothing about "the server always computes the charge amount" changes for the popup.

export type PaystackResumeHandlers = {
  onSuccess: (response: { reference: string }) => void
  onCancel: () => void
  onError?: (error: { message: string }) => void
}

type PaystackPopInstance = {
  resumeTransaction(accessCode: string, handlers: PaystackResumeHandlers): void
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance
  }
}

const INLINE_SCRIPT_URL = 'https://js.paystack.co/v2/inline.js'

let scriptPromise: Promise<void> | null = null

function loadInlineScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = INLINE_SCRIPT_URL
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null // let a retry (e.g. after the visitor's connection recovers) try again
        reject(new Error('Could not load Paystack'))
      }
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

/** Opens Paystack's inline popup for an already-initialized transaction. Never deliver value from
 * onSuccess alone — it's a client-side signal only; the caller must still verify the reference
 * server-side (see verifyAndFulfillCheckout) before treating the purchase as real. */
export async function resumePaystackCheckout(accessCode: string, handlers: PaystackResumeHandlers): Promise<void> {
  await loadInlineScript()
  if (!window.PaystackPop) throw new Error('Could not load Paystack')
  new window.PaystackPop().resumeTransaction(accessCode, handlers)
}
