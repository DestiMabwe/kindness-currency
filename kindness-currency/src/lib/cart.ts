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

// A discount code typed before login, held so it survives the trip to the inbox and back. Only the
// raw code is kept (never a percentage) — it's re-validated server-side once the buyer is logged in.
const PENDING_CODE_KEY = 'kindness-currency:pending-discount-code'
const PENDING_CODE_TTL_MS = 24 * 60 * 60 * 1000

export function savePendingDiscountCode(code: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PENDING_CODE_KEY, JSON.stringify({ code, savedAt: Date.now() }))
}

export function readPendingDiscountCode(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PENDING_CODE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('code' in parsed) ||
      !('savedAt' in parsed) ||
      typeof parsed.code !== 'string' ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null
    }
    if (Date.now() - parsed.savedAt > PENDING_CODE_TTL_MS) {
      clearPendingDiscountCode()
      return null
    }
    return parsed.code
  } catch {
    return null
  }
}

export function clearPendingDiscountCode() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PENDING_CODE_KEY)
}

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

/** Fired by addToCart only (not remove / qty changes), with `{ slug }` as the event detail — for
 * things that react to a real add, like the 3-for-2 popup. */
export const CART_ITEM_ADDED_EVENT = 'kc-cart-item-added'

export function addToCart(slug: string, qty: number = 1) {
  const current = readCartLines()
  const existing = current.find((l) => l.slug === slug)
  writeCartLines(
    existing ? current.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l)) : [...current, { slug, qty }]
  )
  window.dispatchEvent(new CustomEvent(CART_ITEM_ADDED_EVENT, { detail: { slug } }))
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
  clearPendingDiscountCode()
  writeCartLines([])
}
