-- Create saved outfits table
CREATE TABLE IF NOT EXISTS saved_outfits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  top_id TEXT NOT NULL,
  bottom_id TEXT NOT NULL,
  shoes_id TEXT NOT NULL,
  name TEXT,
  ai_suggestion TEXT,
  favorite INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (top_id) REFERENCES clothing_items(id),
  FOREIGN KEY (bottom_id) REFERENCES clothing_items(id),
  FOREIGN KEY (shoes_id) REFERENCES clothing_items(id)
);

CREATE INDEX IF NOT EXISTS idx_saved_outfits_user ON saved_outfits(user_id);
