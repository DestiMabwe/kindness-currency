'use client'

// Cart state for the "pay for several, personalize later" path. Backed by localStorage (not a
// database) so it survives navigation between /create, /cart, and back during a browsing session.

import { useEffect, useState } from 'react'
import { bundleTierBySlug, tierPrice, liveTemplateNameBySlug } from '@/lib/bundleTiers'

const CART_KEY = 'kindness-currency:cart'
// "Purchased, not yet personalized" — an item is removed from this the moment it's actually
// personalized and sent (see markPersonalized), so it only ever reflects what's still pending.
const PURCHASED_KEY = 'kindness-currency:purchased'
// The lasting receipt log — appended to at checkout, never removed from, independent of whether
// the coupons inside have since been personalized. This is what makes "purchase history" actually
// a history, rather than a list that empties itself out as soon as you act on it.
const ORDER_HISTORY_KEY = 'kindness-currency:order-history'

function readSlugs(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeSlugs(key: string, slugs: string[]) {
  window.localStorage.setItem(key, JSON.stringify(slugs))
  window.dispatchEvent(new Event('kc-cart-updated'))
}

export type CartLine = { slug: string; name: string; price: number }
export type OrderRecord = { id: string; date: string; lines: CartLine[]; total: number }

export function priceForSlug(slug: string): number | null {
  const tier = bundleTierBySlug[slug]
  return tier ? tierPrice[tier] : null
}

export function linesForSlugs(slugs: string[]): CartLine[] {
  return slugs
    .map((slug) => {
      const price = priceForSlug(slug)
      const name = liveTemplateNameBySlug[slug]
      return price !== null && name ? { slug, name, price } : null
    })
    .filter((line): line is CartLine => line !== null)
}

/** Cheapest line is free once the cart holds 3 or more — mirrors PRICING.md's 3-for-2 mechanic. */
export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price, 0)
  if (lines.length < 3) return { subtotal, discount: 0, total: subtotal, freeSlug: null as string | null }
  const cheapest = lines.reduce((min, l) => (l.price < min.price ? l : min), lines[0])
  return { subtotal, discount: cheapest.price, total: subtotal - cheapest.price, freeSlug: cheapest.slug }
}

/** Live cart contents — re-reads localStorage on the 'kc-cart-updated' event so every consumer
 * (gallery badge, cart page) stays in sync without prop-drilling or a context provider. */
export function useCartSlugs(): string[] {
  const [slugs, setSlugs] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setSlugs(readSlugs(CART_KEY))
    sync()
    window.addEventListener('kc-cart-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('kc-cart-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return slugs
}

export function addToCart(slug: string) {
  const current = readSlugs(CART_KEY)
  if (current.includes(slug)) return
  writeSlugs(CART_KEY, [...current, slug])
}

export function removeFromCart(slug: string) {
  writeSlugs(CART_KEY, readSlugs(CART_KEY).filter((s) => s !== slug))
}

export function clearCart() {
  writeSlugs(CART_KEY, [])
}

export function usePurchasedSlugs(): string[] {
  const [slugs, setSlugs] = useState<string[]>([])
  useEffect(() => {
    const sync = () => setSlugs(readSlugs(PURCHASED_KEY))
    sync()
    window.addEventListener('kc-cart-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('kc-cart-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return slugs
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

/** Called on "successful" (stubbed) checkout: records a permanent order-history entry, moves the
 * cart into "purchased, not yet personalized", and empties the cart. Personalizing/sending each
 * one afterward reuses the existing template select → edit → Save/Send flow untouched — that flow
 * has never had a payment gate, so paying only ever happens here, once, at checkout. */
export function completePurchase() {
  const cartSlugs = readSlugs(CART_KEY)
  const lines = linesForSlugs(cartSlugs)

  if (lines.length > 0) {
    const { total } = cartTotals(lines)
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(ORDER_HISTORY_KEY) : null
    const existing: OrderRecord[] = raw ? JSON.parse(raw) : []
    const order: OrderRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      date: new Date().toISOString(),
      lines,
      total,
    }
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify([...existing, order]))
  }

  const purchased = readSlugs(PURCHASED_KEY)
  writeSlugs(PURCHASED_KEY, Array.from(new Set([...purchased, ...cartSlugs])))
  writeSlugs(CART_KEY, [])
}

export function markPersonalized(slug: string) {
  writeSlugs(PURCHASED_KEY, readSlugs(PURCHASED_KEY).filter((s) => s !== slug))
}
