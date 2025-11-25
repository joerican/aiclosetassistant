-- Add canvas_layout JSON field to store item positions and sizes
-- Format: { "items": [{ "id": "item123", "x": 100, "y": 50, "width": 150, "height": 200, "zIndex": 1 }] }

ALTER TABLE saved_outfits ADD COLUMN canvas_layout TEXT;
ALTER TABLE saved_outfits ADD COLUMN is_canvas_outfit INTEGER DEFAULT 0;
