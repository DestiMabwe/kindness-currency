-- Remove em dashes from seeded template copy so live rows match seed.sql.
-- Idempotent: each UPDATE only matches rows that still hold the old text.
-- Coupons already sent to recipients (the coupons table) are senders' own content and are left alone.

UPDATE templates SET emotional_tone = 'Everyday acts of care: meals, errands, and undivided time, for the person who''s always taken care of you.' WHERE emotional_tone = 'Everyday acts of care — meals, errands, and undivided time — for the person who''s always taken care of you.';
UPDATE templates SET emotional_tone = 'A year''s worth of little celebrations: cake, treats, and a day built entirely around them.' WHERE emotional_tone = 'A year''s worth of little celebrations — cake, treats, and a day built entirely around them.';
UPDATE templates SET emotional_tone = 'Slow, intimate promises for couples: undivided attention, no phones, no rushing.' WHERE emotional_tone = 'Slow, intimate promises for couples — undivided attention, no phones, no rushing.';
UPDATE templates SET emotional_tone = 'Ride-or-die favours for your best friend: vent sessions, spontaneous plans, zero judgment.' WHERE emotional_tone = 'Ride-or-die favours for your best friend — vent sessions, spontaneous plans, zero judgment.';
UPDATE templates SET emotional_tone = 'He writes his own: eight specific ways to feel loved, so his partner never has to guess.' WHERE emotional_tone = 'He writes his own — eight specific ways to feel loved, so his partner never has to guess.';
UPDATE templates SET emotional_tone = 'She writes her own: eight specific ways to feel loved, so her partner never has to guess.' WHERE emotional_tone = 'She writes her own — eight specific ways to feel loved, so her partner never has to guess.';

UPDATE template_coupons SET micro_copy = 'Whatever it is, I''m already saying yes' WHERE micro_copy = 'Whatever it is — I''m already saying yes';
UPDATE template_coupons SET micro_copy = 'Movie, drive, dancing. You pick, I show up' WHERE micro_copy = 'Movie, drive, dancing — you pick, I show up';
UPDATE template_coupons SET micro_copy = 'Restaurant, takeout, or homemade, your call' WHERE micro_copy = 'Restaurant, takeout, or homemade — your call';
UPDATE template_coupons SET micro_copy = 'Ordered, baked, or bought, however you want it' WHERE micro_copy = 'Ordered, baked, or bought — however you want it';
UPDATE template_coupons SET micro_copy = 'Show me you''re choosing me. Make the first move today' WHERE micro_copy = 'Show me you''re choosing me — make the first move today';
UPDATE template_coupons SET micro_copy = 'I plan a secret activity. You just show up and trust it' WHERE micro_copy = 'I plan a secret activity — you just show up and trust it';
UPDATE template_coupons SET micro_copy = 'Tell me what''s on your mind. No decoding required' WHERE micro_copy = 'Tell me what''s on your mind — no decoding required';
UPDATE template_coupons SET micro_copy = 'Whatever I ask for that day, no script, just say yes' WHERE micro_copy = 'Whatever I ask for that day — no script, just say yes';
UPDATE template_coupons SET micro_copy = 'I don''t need a strategy right now. Just your shoulder' WHERE micro_copy = 'I don''t need a strategy right now — just your shoulder';
UPDATE template_coupons SET micro_copy = 'Reach for me first. No destination required' WHERE micro_copy = 'Reach for me first — no destination required';
UPDATE template_coupons SET micro_copy = 'Tell me what you love about me. Say it out loud' WHERE micro_copy = 'Tell me what you love about me — say it out loud';

UPDATE coming_soon_templates SET blurb_points = array_replace(blurb_points, 'Guy time and shared hobbies — golf, garage projects, the game', 'Guy time and shared hobbies: golf, garage projects, the game') WHERE slug = 'dads';
UPDATE coming_soon_templates SET blurb_points = array_replace(blurb_points, 'Promises that travel — no shared address required', 'Promises that travel, no shared address required') WHERE slug = 'long-distance-lovers';
UPDATE coming_soon_templates SET blurb_points = array_replace(blurb_points, 'Their favorite meal, their call — cooked at home or out on the town', 'Their favorite meal, their call, cooked at home or out on the town') WHERE slug = 'meal-coupons';
UPDATE coming_soon_templates SET blurb_points = array_replace(blurb_points, 'Little holiday magic — stockings, traditions, and one big surprise', 'Little holiday magic: stockings, traditions, and one big surprise') WHERE slug = 'christmas';
