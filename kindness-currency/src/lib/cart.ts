'use client'

// Cart state for the "pay for several, personalize later" path. Backed by localStorage (not a
// database) so it survives navigation between /create, /cart, and back during a browsing session.

import { useEffect, useState } from 'react'
import { bundleTierBySlug, tierPrice, liveTemplateNameBySlug } from '@/lib/bundleTiers'
import { singleUseGestures } from '@/lib/singleUseGestures'

const gestureBySlug = Object.fromEntries(singleUseGestures.map((g) => [g.slug, g]))

const CART_KEY = 'kindness-currency:cart-v2'
// "Purchased, not yet personalized" — an instance is removed from this the moment it's actually
// personalized and sent (see consumePendingInstance), so it only ever reflects what's still pending.
const PURCHASED_KEY = 'kindness-currency:purchased'
// The lasting receipt log — appended to at checkout, never removed from, independent of whether
// the coupons inside have since been personalized. This is what makes "purchase history" actually
// a history, rather than a list that empties itself out as soon as you act on it.
const ORDER_HISTORY_KEY = 'kindness-currency:order-history'

export type CartLineItem = { slug: string; qty: number }
export type CartLine = { slug: string; name: string; price: number; qty: number }
export type OrderRecord = { id: string; date: string; lines: CartLine[]; total: number }

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

export function priceForSlug(slug: string): number | null {
  const tier = bundleTierBySlug[slug]
  if (tier) return tierPrice[tier]
  return gestureBySlug[slug]?.price ?? null
}

function nameForSlug(slug: string): string | undefined {
  return liveTemplateNameBySlug[slug] ?? gestureBySlug[slug]?.serviceTitle
}

export function linesForSlugs(slugs: string[]): CartLine[] {
  return slugs
    .map((slug) => {
      const price = priceForSlug(slug)
      const name = nameForSlug(slug)
      return price !== null && name ? { slug, name, price, qty: 1 } : null
    })
    .filter((line): line is CartLine => line !== null)
}

export function linesForCart(items: CartLineItem[]): CartLine[] {
  return items
    .map(({ slug, qty }) => {
      const price = priceForSlug(slug)
      const name = nameForSlug(slug)
      return price !== null && name ? { slug, name, price, qty } : null
    })
    .filter((line): line is CartLine => line !== null)
}

/** The single cheapest unit is free once the cart holds 3 or more units total (across any mix of
 * lines/quantities) — mirrors PRICING.md's 3-for-2 mechanic. */
export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  const totalUnits = lines.reduce((sum, l) => sum + l.qty, 0)
  if (totalUnits < 3) return { subtotal, discount: 0, total: subtotal, freeSlug: null as string | null }
  const cheapest = lines.reduce((min, l) => (l.price < min.price ? l : min), lines[0])
  return { subtotal, discount: cheapest.price, total: subtotal - cheapest.price, freeSlug: cheapest.slug }
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
 * one (see consumePendingInstance). Only ever populated for real bundle templates: a gesture's
 * send/save flow doesn't persist anything yet, so there'd be nothing real to consume against. */
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

/** Called on "successful" (stubbed) checkout: records a permanent order-history entry, moves the
 * cart into "purchased, not yet personalized", and empties the cart. Personalizing/sending each
 * one afterward reuses the existing template select → edit → Save/Send flow untouched — that flow
 * has never had a payment gate, so paying only ever happens here, once, at checkout. */
export function completePurchase() {
  const cartLines = readCartLines()
  const lines = linesForCart(cartLines)

  if (lines.length > 0) {
    const { total } = cartTotals(lines)
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(ORDER_HISTORY_KEY) : null
    const existing: OrderRecord[] = raw ? JSON.parse(raw) : []
    const order: OrderRecord = {
      id: newId(),
      date: new Date().toISOString(),
      lines,
      total,
    }
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify([...existing, order]))
  }

  const newInstances = cartLines
    .filter((l) => !!bundleTierBySlug[l.slug])
    .flatMap((l) => Array.from({ length: l.qty }, () => ({ id: newId(), slug: l.slug })))
  writePendingInstances([...readPendingInstances(), ...newInstances])
  writeCartLines([])
}

/** Consumes exactly one pending instance for this slug (the buyer just personalized and sent
 * one of possibly several purchased copies) — the rest stay pending. */
export function consumePendingInstance(slug: string) {
  const current = readPendingInstances()
  const idx = current.findIndex((i) => i.slug === slug)
  if (idx === -1) return
  writePendingInstances([...current.slice(0, idx), ...current.slice(idx + 1)])
}
