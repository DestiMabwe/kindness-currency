import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { PromoScrollPopup } from '../PromoScrollPopup'
import { addToCart, clearCart } from '@/lib/cart'
import { singleUseGestures } from '@/lib/singleUseGestures'
import { ctaCopy } from '@/constants/ctaCopy'

const DISMISS_KEY = 'kindness-currency:promo-popup-dismissed'
const SHOW_AFTER_ADD_MS = 1400

describe('PromoScrollPopup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

  it('stays closed while the visitor is just looking, however long they stay or far they scroll', () => {
    render(<PromoScrollPopup />)

    advance(60_000)
    act(() => {
      window.scrollY = 2000
      window.dispatchEvent(new Event('scroll'))
    })
    advance(60_000)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens shortly after the first bundle is added to the cart, once the add confirmation has played', () => {
    render(<PromoScrollPopup />)

    act(() => addToCart('mothers_day'))
    advance(SHOW_AFTER_ADD_MS - 100)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    advance(100)
    expect(screen.getByRole('dialog', { name: ctaCopy.promoPopupHeading })).toBeInTheDocument()
  })

  it('does not open when a one-time gesture is added, since the offer excludes gestures', () => {
    render(<PromoScrollPopup />)

    act(() => addToCart(singleUseGestures[0].slug))
    advance(10_000)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open for removing or changing the cart, only for an add', () => {
    act(() => addToCart('mothers_day', 2))
    render(<PromoScrollPopup />)

    act(() => clearCart())
    advance(10_000)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open while suppressed', () => {
    render(<PromoScrollPopup suppressed />)

    act(() => addToCart('mothers_day'))
    advance(10_000)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open if the visitor already dismissed it this session', () => {
    window.sessionStorage.setItem(DISMISS_KEY, 'true')
    render(<PromoScrollPopup />)

    act(() => addToCart('mothers_day'))
    advance(10_000)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens only once: dismissing it and adding another bundle does not bring it back', () => {
    render(<PromoScrollPopup />)

    act(() => addToCart('mothers_day'))
    advance(SHOW_AFTER_ADD_MS)
    fireEvent.click(screen.getByRole('button', { name: ctaCopy.promoPopupDismiss }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(window.sessionStorage.getItem(DISMISS_KEY)).toBe('true')

    act(() => addToCart('valentines'))
    advance(10_000)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
