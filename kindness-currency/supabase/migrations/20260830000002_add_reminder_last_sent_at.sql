-- Tracks when a reminder email last went out for a set, so the cron job
-- knows whether the next one is due yet (see reminderEngine.isReminderDue).
ALTER TABLE coupon_sets ADD COLUMN reminder_last_sent_at TIMESTAMPTZ;
