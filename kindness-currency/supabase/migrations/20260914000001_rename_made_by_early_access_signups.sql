-- Made By Him/Her were renamed to Requested By Him/Her before launch (see seed.sql, which now
-- seeds them as real `templates` rows under the new slugs instead of `coming_soon_templates`
-- teasers). Unlike template/template_coupons content, early_access_signups is real user data —
-- not reseeded — so any signups recorded under the old slugs are carried forward here rather
-- than left orphaned against a slug nothing references anymore.
UPDATE early_access_signups SET template_slug = 'requested-by-him' WHERE template_slug = 'made-by-him';
UPDATE early_access_signups SET template_slug = 'requested-by-her' WHERE template_slug = 'made-by-her';
