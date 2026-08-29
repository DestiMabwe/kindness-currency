import { Resend } from 'resend'

export type ReminderEmailParams = { to: string; recipientName: string; senderName: string }
export type ReminderEmailSender = { send(params: ReminderEmailParams): Promise<{ success: boolean }> }

/** Thin adapter over Resend — kept separate from reminderJob so the orchestration logic never touches the SDK directly. */
export function createResendReminderEmailSender(apiKey: string, fromEmail: string): ReminderEmailSender {
  const resend = new Resend(apiKey)

  return {
    async send({ to, recipientName, senderName }) {
      const { error } = await resend.emails.send({
        from: fromEmail,
        to,
        subject: `Want a nudge to redeem ${senderName}'s coupons?`,
        html: `<p>Hi ${recipientName},</p><p>${senderName}'s coupons are still waiting for you on Kindness Currency — no pressure, just a gentle nudge.</p>`,
      })
      return { success: !error }
    },
  }
}
