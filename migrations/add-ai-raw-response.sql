-- Add field to store full AI response for later analysis
ALTER TABLE clothing_items ADD COLUMN ai_raw_response TEXT;

-- This will store the complete JSON response from the AI model
-- for debugging and discovering additional capabilities
