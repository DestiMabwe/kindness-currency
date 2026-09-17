'use client'

// Cart state for the "pay for several, personalize later" path. Backed by localStorage (not a
// database) so it survives navigation between /create, /cart, and back during a browsing session.
// Pricing math lives in pricing.ts (no 'use client' — safely importable from server checkout code
// too); this file re-exports it for existing callers plus owns purely local cart/display state.

import { useEffect, useState } from 'react'
import { linesForCart, linesForSlugs, cartTotals, priceForSlug, type CartLineItem, type CartLine } from '@/lib/pricing'

export { linesForCart, linesForSlugs, cartTotals, priceForSlug }
export type { CartLineItem, CartLine }

const CART_KEY = 'kindness-currency:cart-v2'
// The lasting receipt log — appended to once per real, paid checkout (see
// recordCompletedCheckout), never removed from, independent of whether the coupons inside have
// since been personalized.
const ORDER_HISTORY_KEY = 'kindness-currency:order-history'

function readCartLines(): CartLineItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartLineItem[]) : []
  } catch {
    return []
  }
}

function writeCartLines(lines: CartLineItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(lines))
  window.dispatchEvent(new Event('kc-cart-updated'))
}

/** Live cart contents — re-reads localStorage on the 'kc-cart-updated' event so every consumer
 * (gallery badge, cart page) stays in sync without prop-drilling or a context provider. */
export function useCartLines(): CartLineItem[] {
  const [lines, setLines] = useState<CartLineItem[]>([])

  useEffect(() => {
    const sync = () => setLines(readCartLines())
    sync()
    window.addEventListener('kc-cart-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('kc-cart-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return lines
}

export function useCartSlugs(): string[] {
  return useCartLines().map((l) => l.slug)
}

export function addToCart(slug: string, qty: number = 1) {
  const current = readCartLines()
  const existing = current.find((l) => l.slug === slug)
  writeCartLines(
    existing ? current.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l)) : [...current, { slug, qty }]
  )
}

export function removeFromCart(slug: string) {
  writeCartLines(readCartLines().filter((l) => l.slug !== slug))
}

/** Sets a line's quantity directly, for the cart page's own +/- stepper — 0 or below removes the
 * line entirely, same as removeFromCart. */
export function setCartQty(slug: string, qty: number) {
  if (qty <= 0) return removeFromCart(slug)
  writeCartLines(readCartLines().map((l) => (l.slug === slug ? { ...l, qty } : l)))
}

export function clearCart() {
  writeCartLines([])
}

export type OrderRecord = { id: string; date: string; lines: CartLine[]; total: number }

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export function useOrderHistory(): OrderRecord[] {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  useEffect(() => {
    const sync = () => {
      if (typeof window === 'undefined') return
      try {
        const raw = window.localStorage.getItem(ORDER_HISTORY_KEY)
        setOrders(raw ? (JSON.parse(raw) as OrderRecord[]) : [])
      } catch {
        setOrders([])
      }
    }
    sync()
    window.addEventListener('kc-cart-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('kc-cart-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return orders
}

/** Records a real, paid order into the permanent purchase-history cache and clears the cart —
 * called right after a checkout return confirms payment landed, with the real line items/total
 * from the server order rather than re-derived from whatever's currently in the cart (which may
 * have changed since checkout started). */
export function recordCompletedCheckout(lines: CartLine[], total: number) {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(ORDER_HISTORY_KEY)
  const existing: OrderRecord[] = raw ? JSON.parse(raw) : []
  const order: OrderRecord = { id: newId(), date: new Date().toISOString(), lines, total }
  window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify([...existing, order]))
  writeCartLines([])
}
