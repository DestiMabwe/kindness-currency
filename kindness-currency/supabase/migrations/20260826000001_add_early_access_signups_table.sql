-- Early-access signups for not-yet-built "Coming Soon" templates
-- (see coming_soon_templates). One signup per email + template combo.
CREATE TABLE early_access_signups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  name          TEXT NOT NULL CHECK (char_length(name) > 0),
  template_slug TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email, template_slug)
);
