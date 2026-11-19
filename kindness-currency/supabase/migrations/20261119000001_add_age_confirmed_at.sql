-- Records when the sender confirmed they are 18+ for an age-restricted template (self-declaration,
-- not ID verification). Nullable and best-effort: stamped by a separate UPDATE after
-- create_coupon_set() succeeds, so it can never block a save or a paid send.
ALTER TABLE coupon_sets ADD COLUMN age_confirmed_at TIMESTAMPTZ;
