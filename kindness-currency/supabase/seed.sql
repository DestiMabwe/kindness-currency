-- ============================================================
-- Templates
-- ============================================================
INSERT INTO templates (slug, name, theme, decorative_element, emotional_tone, is_age_restricted, is_active, sort_order)
VALUES
  ('mothers_day', 'Mom''s Promise Tokens',       'Promise', 'Flower or ribbon',       'Everyday acts of care — meals, errands, and undivided time — for the person who''s always taken care of you.', false, true, 1),
  ('valentines',  'Valentine''s Love Passes',     'Pass',    'Rose or sparkle',        'Romantic gestures big and small, from breakfast in bed to a night entirely on their terms.',                    false, true, 2),
  ('birthday',    'Birthday Joy Tokens',           'Token',   'Balloon or confetti',    'A year''s worth of little celebrations — cake, treats, and a day built entirely around them.',                 false, true, 3),
  ('lovers',      'Lover''s Intimate Promises',    'Promise', 'Candle or moon',         'Slow, intimate promises for couples — undivided attention, no phones, no rushing.',                             true,  true, 4),
  ('besties',     'Bestie''s Surprise Passes',     'Pass',    'Star or lightning bolt', 'Ride-or-die favours for your best friend — vent sessions, spontaneous plans, zero judgment.',                    false, true, 5),
  ('requested-by-him', 'Requested By Him: Lover''s Wishes', 'Wish', 'Bow', 'He writes his own — eight specific ways to feel loved, so his partner never has to guess.', false, true, 6),
  ('requested-by-her', 'Requested By Her: Lover''s Wishes', 'Wish', 'Bow', 'She writes her own — eight specific ways to feel loved, so her partner never has to guess.', false, true, 7);

-- ============================================================
-- Mom's Promise Tokens — mothers_day
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'Home-Cooked Meal',   'Made with extra love, just the way you like it', 'No expiry · Redeemable anytime'              FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'Errand Run',          'Give me the list. I''ll handle everything',       'No questions asked'                          FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'Full Day Together',   'Your plans, your pace, your person',              'Phone goes away. You have my full attention'  FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'Grocery Shop',        'Your favourites, plus a little extra',            'Just send me the list'                        FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'Bedside Visit',       'Soup, company, and zero judgment',                'Redeemable when you''re under the weather'    FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'Long Phone Call',     'No rushing. Just us talking',                     'Anytime you need it'                          FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'Surprise Treat',      'Something sweet, just because',                   'No occasion needed'                           FROM templates WHERE slug = 'mothers_day';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'Anything You Need',   'Whatever it is — I''m already saying yes',        'Wildcard · No limits'                         FROM templates WHERE slug = 'mothers_day';

-- ============================================================
-- Valentine's Love Passes — valentines
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'Romantic Dinner In', 'Candles, your favourite meal, no interruptions',  'Redeemable any evening · Chef''s kiss guaranteed' FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'Breakfast in Bed',   'Stay right there. I''ve got this',                'Weekend redemption preferred'                      FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'Massage',            'Full focus. No distractions. Just you',           'Duration negotiable'                               FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'Night, Your Choice', 'Movie, drive, dancing — you pick, I show up',     'No vetoes allowed'                                 FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'Love Letter',        'Handwritten. From the heart. No edits',           'Delivered whenever you redeem'                     FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'Chore-Free Day',     'Rest. I''ll handle everything today',             'Valid any day you need a break'                    FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'Surprise Date',      'Just show up. I''ll do the rest',                 'Dress code: whatever makes you feel good'          FROM templates WHERE slug = 'valentines';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'Wild Card',          'Anything, anywhere, anytime',                     'No questions asked · No limits'                    FROM templates WHERE slug = 'valentines';

-- ============================================================
-- Birthday Joy Tokens — birthday
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'Birthday Meal, Your Choice', 'Restaurant, takeout, or homemade — your call', 'Valid all birthday month'                      FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'Cake of Your Choice',        'Ordered, baked, or bought — however you want it', 'Candles included'                          FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'Fun Day Out',                'Pick the vibe. I''ll plan the rest',          'No budget complaints'                          FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'Sleep-In Morning',           'I''ll handle the noise. You stay in bed',     'Redeemable any weekend'                        FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'Playlist Made for You',      'Every song chosen with you in mind',          'Delivered within 24 hours of redemption'       FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'Rant Session',               'Talk. I''ll listen. No advice unless you ask','Unlimited time · Full attention'               FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'Guilt-Free Treat',           'Order the expensive one. No comments from me','One-time use · Fully valid'                    FROM templates WHERE slug = 'birthday';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'Birthday Wish Granted',      'Whatever you want. Today it''s yes',          'Wildcard · Birthday rules apply'               FROM templates WHERE slug = 'birthday';

-- ============================================================
-- Lover's Intimate Promises — lovers (age restricted)
-- ============================================================


-- ============================================================
-- Bestie's Surprise Passes — besties
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'Emergency Vent Call',  'Drop everything. I''m already listening',           'Available 24/7 · No judgment ever'             FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'Unplanned Adventure',  'Say yes first. Ask questions never',                'Destination decided on the day'                FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'Ugly Cry Session',     'Tissues provided. Mascara optional',                'Full duration · Snacks included'               FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'Honest Opinion',       'The real answer. Not the nice one',                 'You asked. I delivered'                        FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'Hype Session',         'I will remind you how incredible you are',          'Redeemable before any big moment'              FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'Night In Together',    'Snacks, bad TV, no plans, no effort',               'Comfy clothes mandatory'                       FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'Errand Buddy',         'I''ll come. I''ll complain. I''ll make it fun',     'Available weekends · Complaints are affectionate' FROM templates WHERE slug = 'besties';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'Wildcard Favour',      'Whatever you need. No explanation required',        'Best friend card · Always valid'               FROM templates WHERE slug = 'besties';

-- ============================================================
-- Requested By Him: Lover's Wishes — requested-by-him
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'Unfiltered Down Time',    'Let me have this time without it meaning something''s wrong', 'No explanation needed'                FROM templates WHERE slug = 'requested-by-him';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'Unconditional Cheer',     'Tell me you''re proud of me, even for the small stuff',        'Small wins count too'                 FROM templates WHERE slug = 'requested-by-him';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'Initiated Intimacy',      'Show me you''re choosing me — make the first move today',      'Your move · No hints required'        FROM templates WHERE slug = 'requested-by-him';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'Surprise Plan',           'I plan a secret activity — you just show up and trust it',     'Surprise · Location TBD'              FROM templates WHERE slug = 'requested-by-him';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'Direct Map',              'Tell me what''s on your mind — no decoding required',          'Plain talk only'                      FROM templates WHERE slug = 'requested-by-him';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'New Adventure',           'Let''s try something brand-new together, as total beginners',  'New activity · Both first-timers'     FROM templates WHERE slug = 'requested-by-him';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'Shared Vision Session',   'An hour to dream up our future trips and goals together',      'One hour · Uninterrupted'             FROM templates WHERE slug = 'requested-by-him';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'Wide-Open Wish',          'Whatever I ask for that day — no script, just say yes',        'Wildcard · No limits'                 FROM templates WHERE slug = 'requested-by-him';

-- ============================================================
-- Requested By Her: Lover's Wishes — requested-by-her
-- ============================================================
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 1, 'Total Logistics Takeover', 'Giving my brain a rest while I watch you handle it',            'Full day · Start to finish'           FROM templates WHERE slug = 'requested-by-her';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 2, 'Venting Without Fixing',   'I don''t need a strategy right now — just your shoulder',       '20 minutes · No fix-it mode'          FROM templates WHERE slug = 'requested-by-her';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 3, 'Soft Touch',              'Reach for me first — no destination required',                  'Just for closeness · No agenda'       FROM templates WHERE slug = 'requested-by-her';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 4, 'Solo Sanctuary Time',      'Time to rest and return to you feeling present',                'One afternoon · Uninterrupted'        FROM templates WHERE slug = 'requested-by-her';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 5, 'Zero-Logistics Date',      'Let''s stop being project managers and just be us again',       'One evening · No admin talk'          FROM templates WHERE slug = 'requested-by-her';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 6, 'Verbalized Appreciation',  'Tell me what you love about me — say it out loud',              'Spoken · No notes allowed'            FROM templates WHERE slug = 'requested-by-her';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 7, 'Somewhere New',            'Take me somewhere we''ve never been',                           'New place · Your pick'                FROM templates WHERE slug = 'requested-by-her';
INSERT INTO template_coupons (template_id, sort_order, service_title, micro_copy, fine_print)
SELECT id, 8, 'Wide-Open Wish',           'Whatever I ask for that day — no script, just say yes',         'Wildcard · No limits'                 FROM templates WHERE slug = 'requested-by-her';

-- ============================================================
-- Single-use gesture templates — src/lib/singleUseGestures.ts
-- One coupon each; content/price/motif stay in the fixture, only identity lives here.
-- ============================================================
INSERT INTO templates (slug, name, is_single_use, is_active, sort_order)
VALUES
  ('relief', 'Rescue Mission', true, true, 1),
  ('presence', 'Quiet Visit', true, true, 2),
  ('encouragement', 'Pep Talk', true, true, 3),
  ('repair', 'Do-Over', true, true, 4),
  ('restoration', 'Recharge Session', true, true, 5),
  ('celebration', 'Night Out', true, true, 6),
  ('adventure', 'Spontaneous Escape', true, true, 7),
  ('honest-truth', 'Hard Talk', true, true, 8);

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

-- ============================================================
-- Coming Soon templates (teasers only, no template_coupons)
-- ============================================================
INSERT INTO coming_soon_templates (slug, name, blurb_points, cover_image_path, sort_order)
VALUES
  ('dads', 'Dad''s Promise Tokens',
    ARRAY[
      'Guy time and shared hobbies — golf, garage projects, the game',
      'Dad jokes, sports talk, and showing up without being asked',
      'For the dad who shows love by doing, not saying'
    ],
    '/images/coming-soon/dads.png', 1),
  ('siblings', 'Sibling Adventure Tokens',
    ARRAY[
      'Spontaneous plans, inside jokes, and zero apologies for chaos',
      'For the sibling who''s part rival, part best friend',
      'Built for teasing, loyalty, and everything in between'
    ],
    '/images/coming-soon/siblings.png', 2),
  ('long-distance-lovers', 'Always Close Promises',
    ARRAY[
      'Made for love that''s stretched across time zones',
      'Promises that travel — no shared address required',
      'For couples counting down to the next visit'
    ],
    '/images/coming-soon/long-distance-lovers.png', 5),
  ('meal-coupons', 'Good Food Tokens',
    ARRAY[
      'Their favorite meal, their call — cooked at home or out on the town',
      'For any loved one with a craving and someone willing to deliver',
      'No occasion required, just an appetite'
    ],
    '/images/coming-soon/meal-coupons.png', 6),
  ('movie-marathon', 'Movie Night Passes',
    ARRAY[
      'A full marathon, their picks, snacks included',
      'For the loved one who wants a couch, a blanket, and no interruptions',
      'Popcorn optional, commitment mandatory'
    ],
    '/images/coming-soon/movie-marathon.png', 7),
  ('shopping-spree', 'Shop Till We Drop Passes',
    ARRAY[
      'A day of browsing, trying on, and saying yes to the cart',
      'For the loved one who deserves company and zero budget guilt',
      'Redeemable in-store, online, or both'
    ],
    '/images/coming-soon/shopping-spree.png', 8),
  ('travel-buddies', 'Travel Buddy Passes',
    ARRAY[
      'A companion for the trip, the road, or the weekend getaway',
      'For the loved one who''s always ready to go somewhere',
      'Destination optional, presence mandatory'
    ],
    '/images/coming-soon/travel-buddies.png', 9),
  ('christmas', 'Christmas Joy Tokens',
    ARRAY[
      'Little holiday magic — stockings, traditions, and one big surprise',
      'For anyone on your list who deserves more than a gift card',
      'Built for the whole season, not just one morning'
    ],
    '/images/coming-soon/christmas.png', 10);
