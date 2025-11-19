-- Add description and notes fields to clothing_items table
-- Run this migration: wrangler d1 execute closet-db --local --file=./migrations/add-description-notes.sql
-- Production: wrangler d1 execute closet-db --file=./migrations/add-description-notes.sql

ALTER TABLE clothing_items ADD COLUMN description TEXT;
ALTER TABLE clothing_items ADD COLUMN notes TEXT;
