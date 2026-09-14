import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPaystackClient } from '../client'

describe('PaystackClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initializeTransaction', () => {
    it('sends the secret key as a bearer token and the amount in the smallest currency unit', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ status: true, data: { authorization_url: 'https://paystack.test/pay/abc', access_code: 'code-1' } }))
      )
      const client = createPaystackClient('sk_test_123')

      const result = await client.initializeTransaction({
        email: 'alex@example.com',
        amountCents: 299,
        currency: 'USD',
        reference: 'kc_1',
        callbackUrl: 'https://kindnesscurrency.app/create',
      })

      expect(result).toEqual({ success: true, authorizationUrl: 'https://paystack.test/pay/abc', accessCode: 'code-1' })
      const [url, init] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe('https://api.paystack.co/transaction/initialize')
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer sk_test_123')
      const body = JSON.parse(init?.body as string)
      expect(body).toEqual({ email: 'alex@example.com', amount: 299, currency: 'USD', reference: 'kc_1', callback_url: 'https://kindnesscurrency.app/create' })
    })

    it('returns a failure result when Paystack responds with status: false', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ status: false, message: 'Invalid key' }), { status: 401 }))
      const client = createPaystackClient('sk_test_bad')

      const result = await client.initializeTransaction({
        email: 'alex@example.com',
        amountCents: 299,
        currency: 'USD',
        reference: 'kc_1',
        callbackUrl: 'https://kindnesscurrency.app/create',
      })

      expect(result).toEqual({ success: false, error: 'Invalid key' })
    })

    it('returns a failure result rather than throwing when the response body is not valid JSON', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response('not json', { status: 500 }))
      const client = createPaystackClient('sk_test_123')

      const result = await client.initializeTransaction({
        email: 'alex@example.com',
        amountCents: 299,
        currency: 'USD',
        reference: 'kc_1',
        callbackUrl: 'https://kindnesscurrency.app/create',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('verifyTransaction', () => {
    it('returns the transaction status on a successful verify call', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ status: true, data: { status: 'success', reference: 'kc_1', amount: 299, currency: 'USD' } }))
      )
      const client = createPaystackClient('sk_test_123')

      const result = await client.verifyTransaction('kc_1')

      expect(result).toEqual({ success: true, status: 'success', reference: 'kc_1', amountCents: 299, currency: 'USD' })
      const [url] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe('https://api.paystack.co/transaction/verify/kc_1')
    })

    it('URL-encodes the reference', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ status: true, data: { status: 'success', reference: 'kc/1 2', amount: 100, currency: 'USD' } }))
      )
      const client = createPaystackClient('sk_test_123')

      await client.verifyTransaction('kc/1 2')

      const [url] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe('https://api.paystack.co/transaction/verify/kc%2F1%202')
    })
  })
})
