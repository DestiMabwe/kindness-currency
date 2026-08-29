import type { DueReminder } from './reminderRepository'

export type ReminderJobDeps = {
  reminderRepository: {
    findDueReminders(now: Date): Promise<DueReminder[]>
    markReminderSent(id: string, sentAt: string): Promise<void>
  }
  emailSender: {
    send(params: { to: string; recipientName: string; senderName: string }): Promise<{ success: boolean }>
  }
}

export type ReminderJobResult = { sent: number; failed: number }

/**
 * Sends one email per due reminder and stamps reminder_last_sent_at only on
 * a successful send, so a failed send gets retried next run instead of
 * silently going quiet. One failure never aborts the rest of the batch.
 */
export async function runReminderJob(deps: ReminderJobDeps, now: Date): Promise<ReminderJobResult> {
  const due = await deps.reminderRepository.findDueReminders(now)

  let sent = 0
  let failed = 0
  for (const reminder of due) {
    const result = await deps.emailSender.send({
      to: reminder.recipientEmail,
      recipientName: reminder.recipientName,
      senderName: reminder.senderName,
    })

    if (result.success) {
      await deps.reminderRepository.markReminderSent(reminder.setId, now.toISOString())
      sent++
    } else {
      failed++
    }
  }

  return { sent, failed }
}
