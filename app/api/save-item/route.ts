import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemId,
      imageUrl,
      imageHash,
      userId = 'default-user',
      category,
      subcategory,
      color,
      brand,
      size,
      description,
      notes,
      cost,
      datePurchased,
      storePurchasedFrom,
      aiMetadata,
      rotation = 0,
      originalFilename
    } = body;

    if (!itemId || !imageUrl || !category) {
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
      `INSERT INTO clothing_items (
        id, user_id, category, subcategory, color, brand, size,
        description, notes,
        original_image_url, thumbnail_url, background_removed_url,
        image_hash, ai_raw_response,
        cost, date_purchased, store_purchased_from,
        favorite, times_worn, rotation, original_filename, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      itemId,
      userId,
      category,
      subcategory || null,
      color || null,
      brand || null,
      size || null,
      description || null,
      notes || null,
      imageUrl,
      imageUrl,
      imageUrl,
      imageHash || null,
      aiMetadata ? JSON.stringify(aiMetadata) : null,
      cost || null,
      datePurchased || null,
      storePurchasedFrom || null,
      0,
      0,
      rotation || 0,
      originalFilename || null,
      timestamp,
      timestamp
    ).run();

    return new Response(JSON.stringify({
      success: true,
      itemId,
      message: 'Item saved successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[save-item] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to save item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
