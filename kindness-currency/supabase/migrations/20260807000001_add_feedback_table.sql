-- User-submitted feedback from the "Give Us Feedback" menu item
CREATE TABLE feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email      TEXT,
  message    TEXT NOT NULL CHECK (char_length(message) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
