import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const formData = await request.formData();
    // Receive cropped WebP image from client
    const processedImage = formData.get('processedImage') as Blob | null;
    const category = formData.get('category') as string;

    // Get itemId from process-item (or generate new one)
    const providedItemId = formData.get('itemId') as string | null;

    // Get perceptual hash from client
    const imageHash = formData.get('imageHash') as string;

    // Get AI metadata
    const aiMetadataStr = formData.get('aiMetadata') as string || null;
    const aiRawResponse = aiMetadataStr;

    // Get user-editable fields
    const subcategory = formData.get('subcategory') as string || null;
    const color = formData.get('color') as string || null;
    const brand = formData.get('brand') as string || null;
    const size = formData.get('size') as string || null;
    const description = formData.get('description') as string || null;
    const notes = formData.get('notes') as string || null;
    const costStr = formData.get('cost') as string;
    const cost = costStr ? parseFloat(costStr) : null;
    const datePurchasedStr = formData.get('date_purchased') as string;
    const datePurchased = datePurchasedStr ? parseInt(datePurchasedStr) : null;
    const storePurchasedFrom = formData.get('store_purchased_from') as string || null;

    if (!processedImage || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { env } = await getCloudflareContext();
    const R2 = env.CLOSET_IMAGES;
    const DB = env.DB;

    if (!R2 || !DB) {
      return new Response(JSON.stringify({ error: 'Storage bindings not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const itemId = providedItemId || crypto.randomUUID();
    const timestamp = Date.now();

    // Upload the cropped WebP image
    const imageKey = `items/${itemId}.webp`;
    const imageBuffer = await processedImage.arrayBuffer();
    console.log('Uploading cropped WebP image:', imageBuffer.byteLength, 'bytes');

    await R2.put(imageKey, imageBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });

    // URLs - thumbnail uses transform param, main image is full size
    const imageUrl = `/api/images/${imageKey}`;
    // Thumbnail will be generated on-the-fly: /api/images/items/xyz.png?w=200

    await DB.prepare(
      `INSERT INTO clothing_items (
        id, user_id, category, subcategory, color, brand, size,
        description, notes,
        original_image_url, thumbnail_url, background_removed_url,
        image_hash, ai_raw_response,
        cost, date_purchased, store_purchased_from,
        favorite, times_worn, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      itemId,
      userId,
      category,
      subcategory,
      color,
      brand,
      size,
      description,
      notes,
      imageUrl,           // original_image_url (now same as processed)
      imageUrl,           // thumbnail_url (transform applied at display time)
      imageUrl,           // background_removed_url
      imageHash,
      aiRawResponse,
      cost,
      datePurchased,
      storePurchasedFrom,
      0, // favorite
      0, // times_worn
      timestamp,
      timestamp
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        message: 'Item uploaded successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload item',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
