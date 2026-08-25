-- Lets a coupon set optionally be linked to the recipient's own account after
-- the fact (e.g. so they can find gifts they've received under Profile).
-- Redemption itself stays account-free — this is purely an opt-in link added
-- later, mirroring the existing sender-side `user_id` column.
ALTER TABLE coupon_sets
  ADD COLUMN recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
