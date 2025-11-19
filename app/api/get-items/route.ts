import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const userId = searchParams.get('userId') || 'default-user'; // TODO: Replace with actual auth

    // Get D1 binding from Cloudflare context
    const { env } = await getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build query based on category filter
    let query = 'SELECT * FROM clothing_items WHERE user_id = ?';
    const params = [userId];

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
      season: item.season,
      original_image_url: item.original_image_url,
      thumbnail_url: item.thumbnail_url,
      background_removed_url: item.background_removed_url,
      tags: item.tags ? JSON.parse(item.tags) : [],
      favorite: Boolean(item.favorite),
      times_worn: item.times_worn,
      last_worn_date: item.last_worn_date,
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
