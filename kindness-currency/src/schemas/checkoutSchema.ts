import { z } from 'zod'

// What a checkout initiation accepts from the client — just slugs and quantities. The server
// (src/lib/checkoutService.ts) is the only place a price is ever computed; nothing here carries an
// amount, so there's nothing for a client to lie about.
export const CartLineItemSchema = z.object({
  slug: z.string().min(1),
  qty: z.number().int().min(1).max(20),
})

export const CartCheckoutInputSchema = z.array(CartLineItemSchema).min(1).max(20)

export type CartCheckoutInput = z.infer<typeof CartCheckoutInputSchema>
