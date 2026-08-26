-- Recipient's chosen reminder cadence, captured via the dismissible picker on
-- /give/[id]. Null means no preference (never chosen, or dismissed without one).
-- Storing the choice only — no scheduled function sends anything against it yet;
-- that's real infra (email provider, cron) needing a separate decision first.
ALTER TABLE coupon_sets ADD COLUMN reminder_frequency TEXT CHECK (reminder_frequency IN ('biweekly', 'monthly', 'quarterly'));
