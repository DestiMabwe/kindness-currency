/**
 * Hardcoded allowlist rather than a role/table — this only ever needs to gate
 * the project owner. ADMIN_EMAILS is a comma-separated list of emails.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false

  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.trim().toLowerCase())
}
