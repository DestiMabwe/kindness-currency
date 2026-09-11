-- Lets a template row represent a single-use "gesture" (src/lib/singleUseGestures.ts), so
-- coupon_sets.template_id has something valid to reference when a gesture is saved/sent — a
-- one-coupon template is a gesture. Distinguished from bundle templates with a boolean, not a
-- template_type TEXT enum (see CLAUDE.md's absolute rule against that). Decorative/pricing fields
-- (motif, price, message starter) stay in the fixture file, not the DB. The 8 gesture rows
-- themselves are seed data — see supabase/seed.sql, matching how the 5 bundle templates are seeded.
ALTER TABLE templates
  ADD COLUMN is_single_use BOOLEAN NOT NULL DEFAULT false;
