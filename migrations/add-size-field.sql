-- Add size field to clothing_items table
-- Run this migration: wrangler d1 execute closet-db --local --file=./migrations/add-size-field.sql
-- Production: wrangler d1 execute closet-db --file=./migrations/add-size-field.sql

ALTER TABLE clothing_items ADD COLUMN size TEXT;
