import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireAuth();

    const { env } = await getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch saved outfits
    const outfitsResult = await DB.prepare(`
      SELECT * FROM saved_outfits WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();

    // Get all unique item IDs (including from canvas outfits)
    const itemIds = new Set<string>();
    outfitsResult.results.forEach((outfit: any) => {
      // Regular outfit IDs
      if (outfit.top_id) itemIds.add(outfit.top_id);
      if (outfit.bottom_id) itemIds.add(outfit.bottom_id);
      if (outfit.shoes_id) itemIds.add(outfit.shoes_id);

      // Canvas outfit IDs
      if (outfit.is_canvas_outfit && outfit.canvas_layout) {
        try {
          const layout = JSON.parse(outfit.canvas_layout);
          layout.items?.forEach((item: any) => {
            if (item.itemId) itemIds.add(item.itemId);
          });
        } catch (e) {
          console.error('Failed to parse canvas layout:', e);
        }
      }
    });

    // Fetch all items at once
    const itemsMap = new Map();
    if (itemIds.size > 0) {
      const placeholders = Array.from(itemIds).map(() => '?').join(',');
      const itemsResult = await DB.prepare(`
        SELECT * FROM clothing_items WHERE id IN (${placeholders})
      `).bind(...Array.from(itemIds)).all();

      itemsResult.results.forEach((item: any) => {
        itemsMap.set(item.id, item);
      });
    }

    // Attach items to outfits
    const outfits = outfitsResult.results.map((outfit: any) => {
      const result: any = {
        ...outfit,
        top: itemsMap.get(outfit.top_id),
        bottom: itemsMap.get(outfit.bottom_id),
        shoes: itemsMap.get(outfit.shoes_id),
      };

      // Attach canvas items
      if (outfit.is_canvas_outfit && outfit.canvas_layout) {
        try {
          const layout = JSON.parse(outfit.canvas_layout);
          result.canvasItems = layout.items?.map((item: any) => ({
            ...item,
            item: itemsMap.get(item.itemId),
          }));
        } catch (e) {
          console.error('Failed to parse canvas layout:', e);
        }
      }

      return result;
    });

    return new Response(JSON.stringify({ outfits }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get outfits error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch outfits',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
