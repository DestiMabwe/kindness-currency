import type { SupabaseClient } from '@supabase/supabase-js'
import type { CouponStatus, ReminderFrequency } from '@/schemas/couponSchema'
import { isReminderDue } from './reminderEngine'

export type DueReminder = {
  setId: string
  recipientEmail: string
  recipientName: string
  senderName: string
  frequency: ReminderFrequency
}

type DueCandidateRow = {
  id: string
  sender_name: string
  recipient_name: string
  recipient_user_id: string
  opened_at: string | null
  reminder_frequency: ReminderFrequency
  reminder_last_sent_at: string | null
  coupons: { status: CouponStatus }[]
}

export function createReminderRepository(supabase: SupabaseClient) {
  return {
    /**
     * Sets whose chosen cadence has elapsed and haven't been fully redeemed
     * yet, paired with the recipient's email resolved via the Supabase admin
     * API — only a recipient who linked their account (recipient_user_id) is
     * reachable, since coupon_sets stores no recipient email of its own.
     */
    async findDueReminders(now: Date): Promise<DueReminder[]> {
      const { data, error } = await supabase
        .from('coupon_sets')
        .select('id, sender_name, recipient_name, recipient_user_id, opened_at, reminder_frequency, reminder_last_sent_at, coupons(status)')
        .not('reminder_frequency', 'is', null)
        .not('recipient_user_id', 'is', null)

      if (error || !data) return []

      const dueRows = (data as DueCandidateRow[]).filter((row) =>
        isReminderDue(
          {
            frequency: row.reminder_frequency,
            openedAt: row.opened_at,
            lastSentAt: row.reminder_last_sent_at,
            allRedeemed: row.coupons.every((c) => c.status === 'redeemed'),
          },
          now
        )
      )

      if (dueRows.length === 0) return []

      const { data: userList, error: userError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      if (userError) return []

      const emailByUserId = new Map(userList.users.filter((u) => u.email).map((u) => [u.id, u.email as string]))

      const reminders: DueReminder[] = []
      for (const row of dueRows) {
        const recipientEmail = emailByUserId.get(row.recipient_user_id)
        if (!recipientEmail) continue
        reminders.push({
          setId: row.id,
          recipientEmail,
          recipientName: row.recipient_name,
          senderName: row.sender_name,
          frequency: row.reminder_frequency,
        })
      }
      return reminders
    },

    /** Stamps a set as reminded so the next isReminderDue check anchors from here. */
    async markReminderSent(id: string, sentAt: string): Promise<void> {
      await supabase.from('coupon_sets').update({ reminder_last_sent_at: sentAt }).eq('id', id)
    },
  }
}
