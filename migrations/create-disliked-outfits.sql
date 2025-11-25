-- Create disliked outfits table to track combinations users don't want
CREATE TABLE IF NOT EXISTS disliked_outfits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  top_id TEXT NOT NULL,
  bottom_id TEXT NOT NULL,
  shoes_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_disliked_outfits_user ON disliked_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_disliked_outfits_combo ON disliked_outfits(top_id, bottom_id, shoes_id);
