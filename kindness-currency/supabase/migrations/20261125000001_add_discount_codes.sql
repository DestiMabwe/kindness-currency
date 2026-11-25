-- Discount codes: a percentage off a cart or single-send checkout, applied server-side only.
-- percent_off = 100 is a free order (no Paystack call — see checkoutService.ts). Additive only:
-- nothing here drops, renames or loosens an existing column.

CREATE TABLE discount_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stored uppercase; the app uppercases what a buyer types before looking it up.
  code            TEXT NOT NULL UNIQUE CHECK (code = upper(code) AND length(code) BETWEEN 3 AND 40),
  percent_off     INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  -- Free-text campaign name ("tester", "mothers-day") — how orders are split out in reporting.
  label           TEXT NOT NULL,
  -- NULL = unlimited total uses. Each person can use a code once regardless (see below).
  max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per paid use. UNIQUE (code_id, user_id) = one use per person per code.
CREATE TABLE discount_redemptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id    UUID NOT NULL REFERENCES discount_codes(id),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code_id, user_id)
);

-- Snapshot on the order, so editing or deleting a code later never changes what an old order paid.
-- amount_cents stays "what was actually charged" (the webhook's amount check relies on that).
ALTER TABLE orders
  ADD COLUMN discount_code_id UUID REFERENCES discount_codes(id),
  ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0;

-- Same convention as every other table: RLS on, no policies, service-role access only.
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_redemptions ENABLE ROW LEVEL SECURITY;

-- Records that an order used its discount code. Safe to call more than once for the same order.
--   p_strict = true  (free orders — no money has moved): refuses with CODE_ALREADY_USED or
--                    CODE_EXHAUSTED, with the code row locked so two concurrent buyers can't both
--                    take the last use.
--   p_strict = false (Paystack orders — the buyer has already been charged): records the use and
--                    never refuses. If two buyers raced for the very last use of a limited code, the
--                    cap can be exceeded by the overlap; a per-person duplicate is silently skipped.
CREATE OR REPLACE FUNCTION redeem_discount_for_order(p_order_id UUID, p_strict BOOLEAN) RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code_id UUID;
  v_user_id UUID;
  v_max     INTEGER;
  v_used    INTEGER;
BEGIN
  SELECT discount_code_id, user_id INTO v_code_id, v_user_id FROM orders WHERE id = p_order_id;
  IF v_code_id IS NULL THEN
    RETURN;
  END IF;

  SELECT max_redemptions INTO v_max FROM discount_codes WHERE id = v_code_id FOR UPDATE;

  IF EXISTS (SELECT 1 FROM discount_redemptions WHERE order_id = p_order_id) THEN
    RETURN;
  END IF;

  IF p_strict THEN
    IF EXISTS (SELECT 1 FROM discount_redemptions WHERE code_id = v_code_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'CODE_ALREADY_USED';
    END IF;
    SELECT count(*) INTO v_used FROM discount_redemptions WHERE code_id = v_code_id;
    IF v_max IS NOT NULL AND v_used >= v_max THEN
      RAISE EXCEPTION 'CODE_EXHAUSTED';
    END IF;
  END IF;

  INSERT INTO discount_redemptions (code_id, user_id, order_id)
  VALUES (v_code_id, v_user_id, p_order_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Not for browsers: only the server (service role) may run it.
REVOKE EXECUTE ON FUNCTION redeem_discount_for_order(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION redeem_discount_for_order(UUID, BOOLEAN) TO service_role;
