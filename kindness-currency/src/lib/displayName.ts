/** The name a person gave us, from their Supabase user metadata — or null if there isn't a usable one. */
export function readDisplayName(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.full_name
  if (typeof raw !== 'string') return null
  const name = raw.trim()
  return name ? name : null
}
