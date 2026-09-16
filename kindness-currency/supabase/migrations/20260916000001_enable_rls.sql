-- Closes the Supabase Security Advisor findings ("RLS Disabled in Public") on every table.
--
-- The comment in 20260915000001 said "no RLS ... ownership enforced entirely in application
-- code, never Postgres policies" — that's true for our own code, but it missed that the
-- NEXT_PUBLIC_SUPABASE_ANON_KEY is shipped to every browser. Without RLS, anyone who reads
-- that key out of the client bundle can hit this project's PostgREST endpoint directly
-- (e.g. `GET /rest/v1/coupon_sets?select=*`) and read or write every row — bcrypt PIN hashes,
-- order emails/amounts, sender/recipient names and messages — completely bypassing the app.
--
-- Every read and write in this codebase already goes through the service-role client
-- (src/lib/supabase/service.ts), which always bypasses RLS regardless of policy count. The
-- anon-key clients (src/lib/supabase/client.ts, server.ts) are only ever used for
-- supabase.auth.* — never `.from()`. So enabling RLS with zero policies matches current
-- app behavior exactly, while closing direct anon/authenticated access over the REST API.
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE coming_soon_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_instances ENABLE ROW LEVEL SECURITY;

-- Fixes the "Function Search Path Mutable" advisor warning: pins search_path so
-- create_coupon_set's unqualified table references (purchased_instances, coupon_sets, coupons)
-- can't be redirected by a caller-controlled search_path to a different schema.
ALTER FUNCTION create_coupon_set(UUID, TEXT, BOOLEAN, JSONB, JSONB)
  SET search_path = public, pg_temp;
