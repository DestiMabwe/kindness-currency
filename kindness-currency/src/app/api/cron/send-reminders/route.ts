import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createReminderRepository } from '@/lib/reminderRepository'
import { createResendReminderEmailSender } from '@/lib/email/reminderEmailSender'
import { runReminderJob } from '@/lib/reminderJob'

/**
 * Hit by Vercel Cron on a schedule (see vercel.json). Requires the shared
 * CRON_SECRET as a bearer token so this can't be triggered by anyone who
 * finds the URL — with no secret configured, every request is rejected.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reminderRepository = createReminderRepository(createServiceClient())
  const emailSender = createResendReminderEmailSender(process.env.RESEND_API_KEY!, process.env.REMINDER_FROM_EMAIL!)

  const result = await runReminderJob({ reminderRepository, emailSender }, new Date())
  return NextResponse.json(result)
}
