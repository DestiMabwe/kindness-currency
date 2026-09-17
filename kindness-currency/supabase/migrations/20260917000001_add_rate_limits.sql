-- Generic fixed-window rate-limit counter, shared by every rate limit except PIN lockout (which
-- has different semantics — see record_pin_attempt below). One row per (key, window). Written
-- only via increment_rate_limit(), which upserts atomically so two racing requests in the same
-- window can never both observe count=1.
CREATE TABLE rate_limits (
  key         TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomically increments the counter for the current fixed window of p_window_seconds and returns
-- the resulting count. SECURITY DEFINER with a pinned search_path since it's the one place this
-- table is ever written, always from the service-role client — see checkRateLimit in
-- src/lib/rateLimit.ts.
CREATE OR REPLACE FUNCTION increment_rate_limit(p_key TEXT, p_window_seconds INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  v_count INTEGER;
BEGIN
  INSERT INTO rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

-- PIN brute-force lockout — a per-coupon-set attempt counter, not a sliding window: the whole set
-- locks once failed_pin_attempts reaches the threshold, distinct from rate_limits above.
ALTER TABLE coupon_sets ADD COLUMN failed_pin_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE coupon_sets ADD COLUMN pin_locked_until TIMESTAMPTZ;

-- Records one PIN attempt's outcome. Success clears the counter/lock. Failure increments the
-- counter and, on reaching 5, locks the set for 15 minutes and resets the counter for the next
-- lockout cycle. Returns the active lock time (NULL if not locked) so the caller can report it.
-- Atomic for the same reason as increment_rate_limit: concurrent wrong guesses must not race past
-- the threshold.
CREATE OR REPLACE FUNCTION record_pin_attempt(p_set_id UUID, p_success BOOLEAN)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempts INTEGER;
  v_locked_until TIMESTAMPTZ;
BEGIN
  IF p_success THEN
    UPDATE coupon_sets SET failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = p_set_id;
    RETURN NULL;
  END IF;

  UPDATE coupon_sets
  SET failed_pin_attempts = failed_pin_attempts + 1
  WHERE id = p_set_id
  RETURNING failed_pin_attempts, pin_locked_until INTO v_attempts, v_locked_until;

  IF v_attempts >= 5 THEN
    v_locked_until := now() + interval '15 minutes';
    UPDATE coupon_sets SET failed_pin_attempts = 0, pin_locked_until = v_locked_until WHERE id = p_set_id;
  END IF;

  RETURN v_locked_until;
END;
$$;
