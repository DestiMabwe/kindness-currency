-- Adds a required category to feedback so submissions are sortable/filterable
-- instead of everything landing in one undifferentiated `message` field.
ALTER TABLE feedback ADD COLUMN type TEXT CHECK (type IN ('bug', 'suggestion', 'question', 'other'));
UPDATE feedback SET type = 'other' WHERE type IS NULL;
ALTER TABLE feedback ALTER COLUMN type SET NOT NULL;
