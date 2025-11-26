import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';
import { validateApiKey } from '@/lib/api-auth';

export async function PUT(request: Request) {
  // Validate API key for external requests
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const userId = await requireAuth();

    const body = await request.json();
    const {
      itemId,
      category,
      subcategory,
      color,
      brand,
      size,
      cost,
      date_purchased,
      store_purchased_from,
      rotation
    } = body;

    if (!itemId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { env } = await getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = Date.now();

    await DB.prepare(
      `UPDATE clothing_items SET
        category = ?,
        subcategory = ?,
        color = ?,
        brand = ?,
        size = ?,
        cost = ?,
        date_purchased = ?,
        store_purchased_from = ?,
        rotation = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?`
    ).bind(
      category || null,
      subcategory || null,
      color || null,
      brand || null,
      size || null,
      cost ? parseFloat(cost) : null,
      date_purchased ? parseInt(date_purchased) : null,
      store_purchased_from || null,
      rotation !== undefined ? rotation : 0,
      timestamp,
      itemId,
      userId
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Item updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Update error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update item',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
