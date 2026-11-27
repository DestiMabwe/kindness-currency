'use server'

import { createClient } from '@/lib/supabase/server'
import { DisplayNameSchema } from '@/schemas/accountSchema'

export type UpdateDisplayNameResult = { success: true; name: string } | { success: false; error: string }

/** Saves the name on the signed-in person's own account. Uses their session, so there is no id to
 * pass in and nobody can change anyone else's name. */
export async function updateDisplayNameAction(rawName: string): Promise<UpdateDisplayNameResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not logged in' }

  const parsed = DisplayNameSchema.safeParse(rawName)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data } })
  if (error) return { success: false, error: 'Something went wrong saving your name. Please try again.' }

  return { success: true, name: parsed.data }
}
