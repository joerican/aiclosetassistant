-- Add status column for queue-based processing
ALTER TABLE clothing_items ADD COLUMN status TEXT DEFAULT 'completed';
ALTER TABLE clothing_items ADD COLUMN error_message TEXT;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_clothing_items_status ON clothing_items(status);
