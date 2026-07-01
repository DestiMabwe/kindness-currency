-- Templates: one row per gift theme, DB-driven so new themes need no deploy
CREATE TABLE templates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  theme              TEXT,
  color_mood         TEXT,
  decorative_element TEXT,
  emotional_tone     TEXT,
  is_age_restricted  BOOLEAN DEFAULT false,
  is_active          BOOLEAN DEFAULT true,
  sort_order         INTEGER DEFAULT 0
);

-- Default coupon content per template; read-only after seed
CREATE TABLE template_coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL,
  service_title TEXT NOT NULL,
  micro_copy  TEXT,
  fine_print  TEXT
);

-- One coupon set per gift created by a sender
CREATE TABLE coupon_sets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id    UUID NOT NULL REFERENCES templates(id),
  sender_name    TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  expiry_date    DATE,
  pin_code       TEXT NOT NULL,  -- bcrypt hash, never plaintext
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'sent', 'viewed')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Individual personalised coupons inside a set
CREATE TABLE coupons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id            UUID NOT NULL REFERENCES coupon_sets(id) ON DELETE CASCADE,
  sort_order        INTEGER NOT NULL,
  service_title     TEXT NOT NULL,
  micro_copy        TEXT,
  fine_print        TEXT,
  font_choice       TEXT NOT NULL DEFAULT 'playfair'
                      CHECK (font_choice IN ('playfair', 'dm-sans')),
  background_color  TEXT,
  background_effect TEXT NOT NULL DEFAULT 'none'
                      CHECK (background_effect IN ('none', 'confetti', 'sparkle', 'soft-glow')),
  status            TEXT NOT NULL DEFAULT 'sent'
                      CHECK (status IN ('sent', 'viewed', 'redeemed')),
  redeemed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- DB-driven campaign banners; activate with a row insert, no deploy needed
CREATE TABLE campaign_banners (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message    TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT false,
  starts_at  TIMESTAMPTZ,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
