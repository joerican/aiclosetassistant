-- Add image_hash field to clothing_items table for duplicate detection
-- Run this migration: wrangler d1 execute closet-db --local --file=./migrations/add-image-hash.sql
-- Production: wrangler d1 execute closet-db --file=./migrations/add-image-hash.sql

ALTER TABLE clothing_items ADD COLUMN image_hash TEXT;

-- Create an index on image_hash for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_image_hash ON clothing_items(image_hash);
