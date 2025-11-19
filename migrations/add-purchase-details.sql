-- Add purchase tracking fields to clothing_items table
-- Run this migration: wrangler d1 execute closet-db --local --file=./migrations/add-purchase-details.sql
-- Production: wrangler d1 execute closet-db --file=./migrations/add-purchase-details.sql

ALTER TABLE clothing_items ADD COLUMN cost REAL;
ALTER TABLE clothing_items ADD COLUMN date_purchased INTEGER;
ALTER TABLE clothing_items ADD COLUMN store_purchased_from TEXT;
