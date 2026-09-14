-- Real billing: one Paystack transaction attempt per row. Snapshotting cart_snapshot means a
-- later PRICING.md change can never retroactively affect an already-paid order.
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'paid', 'failed')),
  amount_cents      INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  paystack_reference TEXT UNIQUE NOT NULL,
  cart_snapshot     JSONB NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  paid_at           TIMESTAMPTZ
);

-- One row per personalizable unit a sender has paid for but not yet sent. Granted only once a
-- webhook confirms payment (see orderRepository.grantPurchasedInstances); consumed atomically by
-- create_coupon_set() below, at the moment a paid coupon set is actually created.
CREATE TABLE purchased_instances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id    UUID NOT NULL REFERENCES templates(id),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  consumed_at    TIMESTAMPTZ,
  coupon_set_id  UUID REFERENCES coupon_sets(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX purchased_instances_lookup_idx
  ON purchased_instances (user_id, template_id, consumed_at);

-- No RLS on either table, matching every other table in this schema — every write goes through
-- the service-role client (see src/lib/supabase/service.ts), with ownership enforced entirely in
-- application code (.eq('user_id', ...) filtering), never Postgres policies.

-- All-or-nothing: consuming a paid entitlement and creating the coupon_set + coupons happen in one
-- transaction, so a crash mid-save can never burn a paid entitlement with nothing created, or let
-- a paid save through without consuming one. `FOR UPDATE SKIP LOCKED` makes the consume step safe
-- against two concurrent sends (double-tap, two tabs) racing for the same instance.
CREATE OR REPLACE FUNCTION create_coupon_set(
  p_user_id UUID,
  p_status TEXT,
  p_requires_payment BOOLEAN,
  p_set JSONB,
  p_coupons JSONB
) RETURNS UUID
LANGUAGE plpgsql
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

  INSERT INTO coupon_sets (user_id, template_id, sender_name, recipient_name, expiry_date, sender_message, pin_code, status)
  VALUES (
    p_user_id,
    v_template_id,
    p_set->>'sender_name',
    p_set->>'recipient_name',
    NULLIF(p_set->>'expiry_date', '')::DATE,
    p_set->>'sender_message',
    p_set->>'pin_code',
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
