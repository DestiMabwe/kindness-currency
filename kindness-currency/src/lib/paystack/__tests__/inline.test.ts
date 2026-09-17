import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('resumePaystackCheckout', () => {
  beforeEach(() => {
    vi.resetModules()
    delete (window as unknown as { PaystackPop?: unknown }).PaystackPop
    document.body.innerHTML = ''
  })

  afterEach(() => {
    delete (window as unknown as { PaystackPop?: unknown }).PaystackPop
  })

  it('injects the InlineJS v2 script tag and calls resumeTransaction with the access code once it loads', async () => {
    const { resumePaystackCheckout } = await import('../inline')
    const resumeTransaction = vi.fn()
    const onSuccess = vi.fn()

    const promise = resumePaystackCheckout('access-code-1', { onSuccess, onCancel: vi.fn() })

    const script = document.querySelector('script[src="https://js.paystack.co/v2/inline.js"]')
    expect(script).not.toBeNull()

    // Simulate the script finishing its load — only then does window.PaystackPop exist, same as
    // a real <script> tag loading asynchronously.
    window.PaystackPop = function PaystackPop() {
      return { resumeTransaction }
    } as unknown as Window['PaystackPop']
    script!.dispatchEvent(new Event('load'))
    await promise

    expect(resumeTransaction).toHaveBeenCalledWith('access-code-1', expect.objectContaining({ onSuccess }))
  })

  it('does not inject a second script tag on a later call once PaystackPop is already loaded', async () => {
    const { resumePaystackCheckout } = await import('../inline')
    const resumeTransaction = vi.fn()
    window.PaystackPop = function PaystackPop() {
      return { resumeTransaction }
    } as unknown as Window['PaystackPop']

    await resumePaystackCheckout('access-code-2', { onSuccess: vi.fn(), onCancel: vi.fn() })

    expect(document.querySelectorAll('script[src="https://js.paystack.co/v2/inline.js"]').length).toBe(0)
    expect(resumeTransaction).toHaveBeenCalledWith('access-code-2', expect.anything())
  })

  it('rejects if the script fails to load, so the caller can show an error instead of hanging', async () => {
    const { resumePaystackCheckout } = await import('../inline')

    const promise = resumePaystackCheckout('access-code-3', { onSuccess: vi.fn(), onCancel: vi.fn() })
    const script = document.querySelector('script[src="https://js.paystack.co/v2/inline.js"]')
    script!.dispatchEvent(new Event('error'))

    await expect(promise).rejects.toThrow('Could not load Paystack')
  })
})
