-- Coming-soon template teasers shown on /templates. These are NOT real
-- functional templates (no template_coupons, not selectable in /create) —
-- just marketing content + cover art for upcoming ideas. Kept separate
-- from `templates` so this content can be updated without touching the
-- real template pipeline.
CREATE TABLE coming_soon_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  blurb_points     TEXT[] NOT NULL,
  cover_image_path TEXT NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  sort_order       INTEGER NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
