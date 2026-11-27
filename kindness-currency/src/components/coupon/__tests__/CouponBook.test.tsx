import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CouponBook } from '../CouponBook'

const scrollTo = vi.fn()

// jsdom has no layout, so give the track a width and move it the way a swipe would.
function swipeTo(track: HTMLElement, page: number, width = 300) {
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: width })
  track.scrollLeft = page * width
  fireEvent.scroll(track)
}

function renderBook(count = 3) {
  const slides = Array.from({ length: count }, (_, i) => <div key={i}>Coupon {i + 1}</div>)
  render(<CouponBook slides={slides} label="Your coupons" />)
  return screen.getByTestId('coupon-book-track')
}

describe('CouponBook', () => {
  beforeEach(() => {
    scrollTo.mockReset()
    Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
  })

  it('opens on the first coupon and says where you are', () => {
    renderBook(8)
    expect(screen.getByText('1 of 8')).toBeInTheDocument()
    expect(screen.getByText('Coupon 1')).toBeInTheDocument()
  })

  it('updates the position as the person swipes', () => {
    const track = renderBook(8)
    swipeTo(track, 2)
    expect(screen.getByText('3 of 8')).toBeInTheDocument()
  })

  it('turns to the next and previous coupon with the arrow buttons', async () => {
    const track = renderBook(3)
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 300 })

    await userEvent.click(screen.getByRole('button', { name: 'Next coupon' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: 'smooth' })
    expect(screen.getByText('2 of 3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Previous coupon' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' })
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('has no previous on the first coupon and no next on the last', () => {
    const track = renderBook(3)
    expect(screen.getByRole('button', { name: 'Previous coupon' })).toBeDisabled()
    swipeTo(track, 2)
    expect(screen.getByRole('button', { name: 'Next coupon' })).toBeDisabled()
  })

  it('jumps straight to a coupon from its dot', async () => {
    const track = renderBook(5)
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 300 })

    await userEvent.click(screen.getByRole('button', { name: 'Go to coupon 4' }))

    expect(scrollTo).toHaveBeenLastCalledWith({ left: 900, behavior: 'smooth' })
    expect(screen.getByText('4 of 5')).toBeInTheDocument()
  })

  it('turns pages with the left and right arrow keys', async () => {
    const track = renderBook(3)
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 300 })

    fireEvent.keyDown(screen.getByRole('region', { name: 'Your coupons' }), { key: 'ArrowRight' })
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('region', { name: 'Your coupons' }), { key: 'ArrowLeft' })
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('does not animate for people who asked for reduced motion', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
    const track = renderBook(3)
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 300 })

    await userEvent.click(screen.getByRole('button', { name: 'Next coupon' }))

    expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: 'auto' })
  })

  it('shows no pager controls for a single coupon', () => {
    renderBook(1)
    expect(screen.queryByRole('button', { name: 'Next coupon' })).not.toBeInTheDocument()
    expect(screen.queryByText('1 of 1')).not.toBeInTheDocument()
  })
})
