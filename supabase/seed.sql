-- ============================================================
-- Templates
-- ============================================================
INSERT INTO templates (slug, name, theme, decorative_element, is_age_restricted, is_active, sort_order)
VALUES
  ('mothers_day', 'Mom''s Promise Tokens',       'Promise', 'Flower or ribbon',       false, true, 1),
  ('valentines',  'Valentine''s Love Passes',     'Pass',    'Rose or sparkle',        false, true, 2),
  ('birthday',    'Birthday Joy Tokens',           'Token',   'Balloon or confetti',    false, true, 3),
  ('lovers',      'Lover''s Intimate Promises',    'Promise', 'Candle or moon',         true,  true, 4),
  ('besties',     'Bestie''s Surprise Passes',     'Pass',    'Star or lightning bolt', false, true, 5);

-- ============================================================
-- Mom's Promise Tokens — mothers_day
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'One Home-Cooked Meal',   'Made with extra love, just the way you like it', 'No expiry · Redeemable anytime'              FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'One Errand Run',          'Give me the list. I''ll handle everything',       'No questions asked'                          FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'One Full Day Together',   'Your plans, your pace, your person',              'Phone goes away. You have my full attention'  FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'One Grocery Shop',        'Your favourites, plus a little extra',            'Just send me the list'                        FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'One Bedside Visit',       'Soup, company, and zero judgment',                'Redeemable when you''re under the weather'    FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'One Long Phone Call',     'No rushing. Just us talking',                     'Anytime you need it'                          FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'One Surprise Treat',      'Something sweet, just because',                   'No occasion needed'                           FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'One Anything You Need',   'Whatever it is — I''m already saying yes',        'Wildcard · No limits'                         FROM templates WHERE slug = 'mothers_day';

-- ============================================================
-- Valentine's Love Passes — valentines
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'One Romantic Dinner In', 'Candles, your favourite meal, no interruptions',  'Redeemable any evening · Chef''s kiss guaranteed' FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'One Breakfast in Bed',   'Stay right there. I''ve got this',                'Weekend redemption preferred'                      FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'One Massage',            'Full focus. No distractions. Just you',           'Duration negotiable'                               FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'One Night, Your Choice', 'Movie, drive, dancing — you pick, I show up',     'No vetoes allowed'                                 FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'One Love Letter',        'Handwritten. From the heart. No edits',           'Delivered whenever you redeem'                     FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'One Chore-Free Day',     'Rest. I''ll handle everything today',             'Valid any day you need a break'                    FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'One Surprise Date',      'Just show up. I''ll do the rest',                 'Dress code: whatever makes you feel good'          FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'One Wild Card',          'Anything, anywhere, anytime',                     'No questions asked · No limits'                    FROM templates WHERE slug = 'valentines';

-- ============================================================
-- Birthday Joy Tokens — birthday
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'One Birthday Meal, Your Choice', 'Restaurant, takeout, or homemade — your call', 'Valid all birthday month'                      FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'One Cake of Your Choice',        'Ordered, baked, or bought — however you want it', 'Candles included'                          FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'One Fun Day Out',                'Pick the vibe. I''ll plan the rest',          'No budget complaints'                          FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'One Sleep-In Morning',           'I''ll handle the noise. You stay in bed',     'Redeemable any weekend'                        FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'One Playlist Made for You',      'Every song chosen with you in mind',          'Delivered within 24 hours of redemption'       FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'One Rant Session',               'Talk. I''ll listen. No advice unless you ask','Unlimited time · Full attention'               FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'One Guilt-Free Treat',           'Order the expensive one. No comments from me','One-time use · Fully valid'                    FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'One Birthday Wish Granted',      'Whatever you want. Today it''s yes',          'Wildcard · Birthday rules apply'               FROM templates WHERE slug = 'birthday';

-- ============================================================
-- Lover's Intimate Promises — lovers (age restricted)
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'One Night With No Phones',       'Just us. The screens can wait',               'Full evening · No exceptions'                  FROM templates WHERE slug = 'lovers';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'One Long Bath Together',         'Candles, music, no rushing',                  'Redeemable any evening'                        FROM templates WHERE slug = 'lovers';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'One Morning We Don''t Leave Bed','Nowhere to be. Nothing to do',                'Weekend use only'                              FROM templates WHERE slug = 'lovers';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'One Dance in the Kitchen',       'No music required. Just us',                  'Redeemable anytime, without warning'           FROM templates WHERE slug = 'lovers';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'One Honest Conversation',        'No guards. No defensiveness. Just truth',     'Safe space guaranteed'                         FROM templates WHERE slug = 'lovers';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'One Night You Plan Everything',  'I''ll just say yes to whatever you decide',   'Full surrender of the evening'                 FROM templates WHERE slug = 'lovers';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'One Love Language Act',          'However you feel most loved — I''m doing that','You define it. I deliver it'                  FROM templates WHERE slug = 'lovers';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'One Anything After Midnight',    'You know what this means',                    'Wildcard · No elaboration needed'              FROM templates WHERE slug = 'lovers';

-- ============================================================
-- Bestie's Surprise Passes — besties
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'One Emergency Vent Call',  'Drop everything. I''m already listening',           'Available 24/7 · No judgment ever'             FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'One Unplanned Adventure',  'Say yes first. Ask questions never',                'Destination decided on the day'                FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'One Ugly Cry Session',     'Tissues provided. Mascara optional',                'Full duration · Snacks included'               FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'One Honest Opinion',       'The real answer. Not the nice one',                 'You asked. I delivered'                        FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'One Hype Session',         'I will remind you how incredible you are',          'Redeemable before any big moment'              FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'One Night In Together',    'Snacks, bad TV, no plans, no effort',               'Comfy clothes mandatory'                       FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'One Errand Buddy',         'I''ll come. I''ll complain. I''ll make it fun',     'Available weekends · Complaints are affectionate' FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'One Wildcard Favour',      'Whatever you need. No explanation required',        'Best friend card · Always valid'               FROM templates WHERE slug = 'besties';

-- ============================================================
-- Campaign banner — Mother's Day launch
-- ============================================================
INSERT INTO campaign_banners (message, is_active, starts_at, ends_at)
VALUES (
  'Stand a chance to win a cash prize by using the Mom''s Promise Tokens before May 30th 🎉',
  true,
  '2026-05-24T00:00:00Z',
  '2026-05-30T23:59:59Z'
);
