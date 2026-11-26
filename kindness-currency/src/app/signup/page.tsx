import { redirect } from 'next/navigation'

// One sign-in page serves both tabs; /signup is just a friendlier address for the Sign Up one.
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const target = new URLSearchParams({ mode: 'signup' })
  if (next) target.set('next', next)
  redirect(`/login?${target.toString()}`)
}
