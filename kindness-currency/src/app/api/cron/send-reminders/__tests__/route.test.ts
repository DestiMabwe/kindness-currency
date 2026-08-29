import { describe, it, expect, vi, beforeEach } from 'vitest'

const runReminderJob = vi.fn()
vi.mock('@/lib/reminderJob', () => ({ runReminderJob }))
vi.mock('@/lib/reminderRepository', () => ({ createReminderRepository: vi.fn().mockReturnValue({}) }))
vi.mock('@/lib/email/reminderEmailSender', () => ({ createResendReminderEmailSender: vi.fn().mockReturnValue({}) }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))

describe('GET /api/cron/send-reminders', () => {
  beforeEach(() => {
    vi.resetModules()
    runReminderJob.mockReset()
    process.env.CRON_SECRET = 'test-secret'
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.REMINDER_FROM_EMAIL = 'reminders@example.com'
  })

  it('rejects a request without the correct bearer secret', async () => {
    const { GET } = await import('../route')
    const request = new Request('https://example.com/api/cron/send-reminders')

    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(runReminderJob).not.toHaveBeenCalled()
  })

  it('runs the reminder job when the bearer secret matches', async () => {
    runReminderJob.mockResolvedValue({ sent: 2, failed: 0 })
    const { GET } = await import('../route')
    const request = new Request('https://example.com/api/cron/send-reminders', {
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ sent: 2, failed: 0 })
  })
})
