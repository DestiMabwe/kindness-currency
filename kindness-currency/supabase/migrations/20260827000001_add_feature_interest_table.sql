-- Early-access signups for Custom Coupon Books — a real, planned paid feature
-- (build one custom-written coupon book at a time), not yet built. Recording a
-- row here is the entire signal for now; flags.ts's bulkCreation/analyticsDashboard
-- stay false. `feature` stays a column (not folded away) so a future paid idea
-- can be tracked the same way without a schema change.
CREATE TABLE feature_interest (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature    TEXT NOT NULL CHECK (feature IN ('custom_coupons')),
  email      TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
