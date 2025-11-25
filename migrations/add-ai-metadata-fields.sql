-- Add AI-detected metadata fields for outfit matching
ALTER TABLE clothing_items ADD COLUMN fit TEXT;
ALTER TABLE clothing_items ADD COLUMN style TEXT;
ALTER TABLE clothing_items ADD COLUMN material TEXT;
ALTER TABLE clothing_items ADD COLUMN boldness TEXT;
