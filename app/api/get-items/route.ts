import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Get D1 binding from Cloudflare context
    const { env } = await getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build query based on category filter - only show completed items
    let query = 'SELECT * FROM clothing_items WHERE user_id = ? AND status = ?';
    const params = [userId, 'completed'];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    // Execute query
    const result = await DB.prepare(query).bind(...params).all();

    // Transform results to match ClothingItem interface
    const items = result.results.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      category: item.category,
      subcategory: item.subcategory,
      color: item.color,
      brand: item.brand,
      size: item.size,
      description: item.description,
      notes: item.notes,
      season: item.season,
      original_image_url: item.original_image_url,
      thumbnail_url: item.thumbnail_url,
      background_removed_url: item.background_removed_url,
      tags: item.tags ? JSON.parse(item.tags) : [],
      favorite: Boolean(item.favorite),
      times_worn: item.times_worn,
      last_worn_date: item.last_worn_date,
      cost: item.cost,
      date_purchased: item.date_purchased,
      store_purchased_from: item.store_purchased_from,
      rotation: item.rotation || 0,
      original_filename: item.original_filename,
      // AI-detected metadata
      fit: item.fit,
      style: item.style,
      material: item.material,
      boldness: item.boldness,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        items,
        count: items.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get items error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch items',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
