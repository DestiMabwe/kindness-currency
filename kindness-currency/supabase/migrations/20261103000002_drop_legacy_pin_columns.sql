-- Migration 2 of the recipient-generated PIN cutover (see PRD.md Module 5, and
-- 20261103000001_add_redemption_otps.sql for migration 1).
--
-- Removes the retired sender-set PIN: the bcrypt hash column, the per-set lockout counters, and
-- the record_pin_attempt() function. Redemption now uses redemption_otps + record_otp_failure().
--
-- DO NOT APPLY until migration 1 is live in production AND the new flow has been verified
-- end to end there (create a gift, recipient generates a PIN, sender enters it). Dropping
-- pin_code is irreversible: the existing hashes are lost.
--
-- Order matters. create_coupon_set() names pin_code in its INSERT, so it must be redefined
-- first; dropping the column while the old definition exists would break every gift creation.

-- Same body as 20260915000001, minus pin_code. CREATE OR REPLACE replaces the function's
-- attributes as well as its body, so the pinned search_path from 20260916000001 is restated here
-- — leaving it off would silently re-open the "Function Search Path Mutable" advisor finding.
CREATE OR REPLACE FUNCTION create_coupon_set(
  p_user_id UUID,
  p_status TEXT,
  p_requires_payment BOOLEAN,
  p_set JSONB,
  p_coupons JSONB
) RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_template_id UUID := (p_set->>'template_id')::UUID;
  v_instance_id UUID;
  v_set_id UUID;
BEGIN
  IF p_requires_payment THEN
    UPDATE purchased_instances
    SET consumed_at = NOW()
    WHERE id = (
      SELECT pi.id FROM purchased_instances pi
      WHERE pi.user_id = p_user_id
        AND pi.template_id = v_template_id
        AND pi.consumed_at IS NULL
      ORDER BY pi.created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING purchased_instances.id INTO v_instance_id;

    IF v_instance_id IS NULL THEN
      RAISE EXCEPTION 'PAYMENT_REQUIRED';
    END IF;
  END IF;

  INSERT INTO coupon_sets (user_id, template_id, sender_name, recipient_name, expiry_date, sender_message, status)
  VALUES (
    p_user_id,
    v_template_id,
    p_set->>'sender_name',
    p_set->>'recipient_name',
    NULLIF(p_set->>'expiry_date', '')::DATE,
    p_set->>'sender_message',
    p_status
  )
  RETURNING coupon_sets.id INTO v_set_id;

  INSERT INTO coupons (set_id, sort_order, service_title, micro_copy, fine_print, font_choice, background_color, background_effect, status)
  SELECT
    v_set_id,
    (c->>'sort_order')::INTEGER,
    c->>'service_title',
    c->>'micro_copy',
    c->>'fine_print',
    c->>'font_choice',
    c->>'background_color',
    c->>'background_effect',
    'sent'
  FROM jsonb_array_elements(p_coupons) AS c;

  IF v_instance_id IS NOT NULL THEN
    UPDATE purchased_instances SET coupon_set_id = v_set_id WHERE id = v_instance_id;
  END IF;

  RETURN v_set_id;
END;
$$;

-- Nothing calls this any more (redemptionEngine.ts uses record_otp_failure instead).
DROP FUNCTION IF EXISTS record_pin_attempt(UUID, BOOLEAN);

ALTER TABLE coupon_sets
  DROP COLUMN IF EXISTS pin_code,
  DROP COLUMN IF EXISTS failed_pin_attempts,
  DROP COLUMN IF EXISTS pin_locked_until;
