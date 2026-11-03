-- Recipient-generated, short-lived redemption PINs (PRD Module 5, amended 2026-11-03).
--
-- The recipient taps "Generate Redemption PIN" on /give/[uuid]; the server stores only a bcrypt
-- hash of the 4-digit PIN here and returns the raw PIN once. The signed-in sender then enters it
-- to redeem. Replaces the sender-set coupon_sets.pin_code (kept, nullable, until migration 2).
--
-- consumed_at means "no longer usable" — set on successful redemption, when a newer PIN
-- supersedes this one, or when it burns its 5 attempts. The partial unique index below
-- guarantees at most one live OTP per coupon.
CREATE TABLE redemption_otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  pin_hash    TEXT NOT NULL,  -- bcrypt hash (10 rounds), never plaintext
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX redemption_otps_one_live_per_coupon
  ON redemption_otps (coupon_id)
  WHERE consumed_at IS NULL;

-- Service-role client only (src/lib/supabase/service.ts). RLS on with zero policies, same stance
-- as 20260916000001: the anon key ships to every browser, and pin_hash must never be reachable.
ALTER TABLE redemption_otps ENABLE ROW LEVEL SECURITY;

-- Records one wrong guess against an OTP and returns the new attempt count. On reaching 5 the
-- OTP is killed (consumed_at set) so the recipient must generate a new one. Atomic, like
-- record_pin_attempt: concurrent wrong guesses must not race past the threshold. Only touches
-- a live OTP, so a late guess against a dead one returns NULL and changes nothing.
CREATE OR REPLACE FUNCTION record_otp_failure(p_otp_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE redemption_otps
  SET attempts = attempts + 1,
      consumed_at = CASE WHEN attempts + 1 >= 5 THEN now() ELSE NULL END
  WHERE id = p_otp_id
    AND consumed_at IS NULL
  RETURNING attempts INTO v_attempts;

  RETURN v_attempts;
END;
$$;

-- Migration 2 (a later, separate migration, after the new flow is verified in production) drops
-- coupon_sets.pin_code, failed_pin_attempts, pin_locked_until and record_pin_attempt().
ALTER TABLE coupon_sets ALTER COLUMN pin_code DROP NOT NULL;
