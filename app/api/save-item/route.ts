import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';
import { validateApiKey } from '@/lib/api-auth';

export async function POST(request: Request) {
  // Validate API key for external requests
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const userId = await requireAuth();

    const body = await request.json();
    const {
      itemId,
      imageUrl,
      imageHash,
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
    const R2 = env.CLOSET_IMAGES;

    if (!DB || !R2) {
      return new Response(JSON.stringify({ error: 'Database or storage not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = Date.now();

    // Extract the R2 key from imageUrl
    const currentKey = imageUrl.replace('/api/images/', '');

    // Check if image is in pending/ folder (new flow) or already in items/ folder (old items)
    const isPending = currentKey.startsWith('pending/');
    let finalKey = currentKey;
    let finalImageUrl = imageUrl;

    if (isPending) {
      // New flow: Move from pending/ to items/
      finalKey = currentKey.replace('pending/', 'items/');
      finalImageUrl = `/api/images/${finalKey}`;

      console.log(`[save-item] Moving image from ${currentKey} to ${finalKey}`);

      try {
        // Copy from pending to items
        const pendingImage = await R2.get(currentKey);
        if (!pendingImage) {
          throw new Error(`Image not found at ${currentKey}`);
        }

        await R2.put(finalKey, pendingImage.body, {
          httpMetadata: { contentType: 'image/webp' },
        });

        // Delete from pending
        await R2.delete(currentKey);
        console.log(`[save-item] Successfully moved image to ${finalKey}`);
      } catch (r2Error) {
        console.error('[save-item] R2 move error:', r2Error);
        return new Response(JSON.stringify({
          error: 'Failed to move image to final location',
          details: r2Error instanceof Error ? r2Error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Old items already in items/ folder - no need to move, just update DB
      console.log(`[save-item] Image already in final location: ${currentKey}`);
    }

    await DB.prepare(
      `UPDATE clothing_items SET
        user_id = ?,
        original_image_url = ?,
        thumbnail_url = ?,
        category = ?,
        subcategory = ?,
        color = ?,
        brand = ?,
        size = ?,
        description = ?,
        notes = ?,
        cost = ?,
        date_purchased = ?,
        store_purchased_from = ?,
        rotation = ?,
        original_filename = ?,
        status = 'completed',
        updated_at = ?
      WHERE id = ?`
    ).bind(
      userId,
      finalImageUrl,
      finalImageUrl,
      category,
      subcategory || null,
      color || null,
      brand || null,
      size || null,
      description || null,
      notes || null,
      cost || null,
      datePurchased || null,
      storePurchasedFrom || null,
      rotation || 0,
      originalFilename || null,
      timestamp,
      itemId
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
