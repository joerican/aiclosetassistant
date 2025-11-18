-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Clothing items table
CREATE TABLE IF NOT EXISTS clothing_items (
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
  FOREIGN KEY (user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clothing_user_category ON clothing_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_clothing_user_created ON clothing_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clothing_favorite ON clothing_items(user_id, favorite);

-- Outfits table (saved combinations)
CREATE TABLE IF NOT EXISTS outfits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  item_ids TEXT NOT NULL,
  occasion TEXT,
  favorite INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outfits_user ON outfits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfits_favorite ON outfits(user_id, favorite);

-- Wear history table (optional tracking)
CREATE TABLE IF NOT EXISTS wear_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  outfit_id TEXT,
  worn_date INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES clothing_items(id) ON DELETE CASCADE,
  FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wear_history_user ON wear_history(user_id, worn_date DESC);
CREATE INDEX IF NOT EXISTS idx_wear_history_item ON wear_history(item_id, worn_date DESC);
