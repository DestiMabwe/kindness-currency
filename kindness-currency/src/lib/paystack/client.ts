// Thin server-only wrapper over Paystack's REST API — no SDK dependency needed. Never import this
// from a component file; PAYSTACK_SECRET_KEY must never reach the browser.

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export type InitializeTransactionParams = {
  email: string
  amountCents: number
  currency: string
  reference: string
  callbackUrl: string
}

export type InitializeTransactionResult =
  | { success: true; authorizationUrl: string; accessCode: string }
  | { success: false; error: string }

export type VerifyTransactionResult =
  | { success: true; status: 'success' | 'failed' | 'abandoned'; reference: string; amountCents: number; currency: string }
  | { success: false; error: string }

export type PaystackClient = {
  initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResult>
  verifyTransaction(reference: string): Promise<VerifyTransactionResult>
}

export function createPaystackClient(secretKey: string): PaystackClient {
  const headers = {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  }

  return {
    async initializeTransaction({ email, amountCents, currency, reference, callbackUrl }) {
      const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, amount: amountCents, currency, reference, callback_url: callbackUrl }),
      })
      const body = (await res.json().catch(() => null)) as {
        status?: boolean
        message?: string
        data?: { authorization_url: string; access_code: string }
      } | null

      if (!res.ok || !body?.status || !body.data) {
        return { success: false, error: body?.message ?? 'Paystack initialize failed' }
      }
      return { success: true, authorizationUrl: body.data.authorization_url, accessCode: body.data.access_code }
    },

    async verifyTransaction(reference) {
      const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers,
      })
      const body = (await res.json().catch(() => null)) as {
        status?: boolean
        message?: string
        data?: { status: 'success' | 'failed' | 'abandoned'; reference: string; amount: number; currency: string }
      } | null

      if (!res.ok || !body?.status || !body.data) {
        return { success: false, error: body?.message ?? 'Paystack verify failed' }
      }
      return {
        success: true,
        status: body.data.status,
        reference: body.data.reference,
        amountCents: body.data.amount,
        currency: body.data.currency,
      }
    },
  }
}
