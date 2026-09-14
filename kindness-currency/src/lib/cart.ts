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
// "Purchased, not yet personalized" — a display cache only, synced from the server's real
// purchased_instances after a checkout return confirms payment (see
// syncPurchasedInstancesFromServer). Enforcement of who's actually entitled to send happens
// server-side in create_coupon_set(); this can never be trusted for that.
const PURCHASED_KEY = 'kindness-currency:purchased'
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

export type PurchasedInstance = { id: string; slug: string }
export type OrderRecord = { id: string; date: string; lines: CartLine[]; total: number }

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

function readPendingInstances(): PurchasedInstance[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PURCHASED_KEY)
    return raw ? (JSON.parse(raw) as PurchasedInstance[]) : []
  } catch {
    return []
  }
}

function writePendingInstances(instances: PurchasedInstance[]) {
  window.localStorage.setItem(PURCHASED_KEY, JSON.stringify(instances))
  window.dispatchEvent(new Event('kc-cart-updated'))
}

/** One entry per purchased-but-not-yet-personalized unit — a buyer of qty 2 of the same template
 * gets 2 independent instances here, each consumed separately as they personalize and send each
 * one (see consumePendingInstance). Only ever populated for real bundle templates: gestures are
 * never sold through the cart (see singleUseGestures/GestureFlow's own direct-checkout path). */
export function usePendingInstances(): PurchasedInstance[] {
  const [instances, setInstances] = useState<PurchasedInstance[]>([])
  useEffect(() => {
    const sync = () => setInstances(readPendingInstances())
    sync()
    window.addEventListener('kc-cart-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('kc-cart-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return instances
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

/** Overwrites the local "paid, not yet personalized" cache with the server's real, authoritative
 * list of unconsumed purchased_instances — called right after a checkout return confirms payment
 * landed (see CartCompleteView). Purely a display cache: enforcement of who's actually entitled to
 * send lives entirely server-side in the create_coupon_set() Postgres function, never here. */
export function syncPurchasedInstancesFromServer(instances: PurchasedInstance[]) {
  writePendingInstances(instances)
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

/** Consumes exactly one pending instance for this slug (the buyer just personalized and sent
 * one of possibly several purchased copies) — the rest stay pending. Purely a display-cache
 * update; the real consumption already happened server-side inside create_coupon_set(). */
export function consumePendingInstance(slug: string) {
  const current = readPendingInstances()
  const idx = current.findIndex((i) => i.slug === slug)
  if (idx === -1) return
  writePendingInstances([...current.slice(0, idx), ...current.slice(idx + 1)])
}
