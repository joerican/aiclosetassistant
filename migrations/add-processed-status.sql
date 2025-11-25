-- Add CHECK constraint for status field to include 'processed' state
-- Status flow: pending -> processing -> processed -> completed
-- 'processed' = AI processing done, waiting for user confirmation
-- 'completed' = User confirmed and item is saved to closet

-- Since SQLite doesn't support adding CHECK constraints to existing columns,
-- we need to recreate the table with the new constraint

-- Create new table with CHECK constraint on status
CREATE TABLE clothing_items_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('tops', 'bottoms', 'shoes', 'outerwear', 'accessories')),
  subcategory TEXT,
  color TEXT,
  brand TEXT,
  season TEXT CHECK(season IN ('spring', 'summer', 'fall', 'winter', 'all')),
  original_image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  background_removed_url TEXT,
  tags TEXT,
  favorite INTEGER DEFAULT 0,
  times_worn INTEGER DEFAULT 0,
  last_worn_date INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  cost REAL,
  date_purchased INTEGER,
  store_purchased_from TEXT,
  size TEXT,
  description TEXT,
  notes TEXT,
  image_hash TEXT,
  ai_raw_response TEXT,
  rotation INTEGER DEFAULT 0,
  original_filename TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'processed', 'completed', 'failed')),
  error_message TEXT,
  fit TEXT,
  style TEXT,
  material TEXT,
  boldness TEXT
);

-- Copy all data from old table
INSERT INTO clothing_items_new SELECT * FROM clothing_items;

-- Drop old table
DROP TABLE clothing_items;

-- Rename new table
ALTER TABLE clothing_items_new RENAME TO clothing_items;

-- Recreate indexes
CREATE INDEX idx_user_category ON clothing_items(user_id, category);
CREATE INDEX idx_status ON clothing_items(status);
CREATE INDEX idx_image_hash ON clothing_items(image_hash);
