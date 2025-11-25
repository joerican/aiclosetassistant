import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const itemId = resolvedParams.id;

    const { env } = await getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await DB.prepare(`
      SELECT
        id, status, error_message, original_image_url, thumbnail_url,
        category, subcategory, color, brand, description, tags
      FROM clothing_items
      WHERE id = ?
    `).bind(itemId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON fields
    const item = {
      ...result,
      tags: result.tags ? JSON.parse(result.tags as string) : null,
    };

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[item-status] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
