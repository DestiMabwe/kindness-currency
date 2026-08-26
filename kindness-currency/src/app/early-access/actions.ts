'use server'

import { createEarlyAccessSignupRepository, type SignUpForEarlyAccessResult } from '@/lib/earlyAccessSignupRepository'
import { createServiceClient } from '@/lib/supabase/service'

export async function signUpForEarlyAccessAction(input: unknown): Promise<SignUpForEarlyAccessResult> {
  return createEarlyAccessSignupRepository(createServiceClient()).signUpForEarlyAccess(input)
}
