/**
 * Per-set cookie recording that this browser's visitor confirmed they are 18+ for one age-restricted
 * gift. Holds no personal data (value is just "1"), is httpOnly, and is scoped to the one
 * /give/[id] path — the link itself stays a bare /give/[uuid], never carrying any query parameter.
 */
export const AGE_GATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export function ageGateCookieName(setId: string): string {
  return `kc_age_ok_${setId}`
}
