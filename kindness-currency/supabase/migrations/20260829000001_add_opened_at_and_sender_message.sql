-- Feature 1 (Opened State): closes the loop for the sender even without a
-- redemption. Written once, server-side, the first time the recipient loads
-- /give/[id] — never overwritten on repeat visits.
ALTER TABLE coupon_sets ADD COLUMN opened_at TIMESTAMPTZ;

-- Feature 2 (Message-Before-Reveal): the sender's personal note, shown as a
-- standalone moment before the coupon reveal. Optional — a set with none
-- skips straight to the reveal.
ALTER TABLE coupon_sets ADD COLUMN sender_message TEXT;
