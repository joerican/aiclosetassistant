import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const originalImage = formData.get('originalImage') as File;
    const processedImage = formData.get('processedImage') as File;
    const category = formData.get('category') as string;
    const userId = formData.get('userId') as string || 'default-user'; // TODO: Replace with actual auth

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

    console.log('Received fields:', { subcategory, color, brand, size, description, notes, cost, datePurchased, storePurchasedFrom });

    if (!originalImage || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Cloudflare bindings from context
    const { env } = await getCloudflareContext();
    const R2 = env.CLOSET_IMAGES;
    const DB = env.DB;
    const IMAGES = env.IMAGES;

    if (!R2 || !DB || !IMAGES) {
      return new Response(JSON.stringify({ error: 'Storage bindings not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique ID for this item
    const itemId = crypto.randomUUID();
    const timestamp = Date.now();

    // Hash the original image for duplicate detection
    const originalImageBuffer = await originalImage.arrayBuffer();
    const originalHashBuffer = await crypto.subtle.digest('SHA-256', originalImageBuffer);
    const originalImageHash = Array.from(new Uint8Array(originalHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log('Original image hash:', originalImageHash);

    // Check for duplicates
    const duplicateCheck = await DB.prepare(
      'SELECT id, subcategory, color, brand FROM clothing_items WHERE user_id = ? AND image_hash = ? LIMIT 1'
    ).bind(userId, originalImageHash).first();

    if (duplicateCheck) {
      const itemInfo = duplicateCheck;
      const itemDescription = [
        itemInfo.subcategory,
        itemInfo.color,
        itemInfo.brand
      ].filter(Boolean).join(', ') || 'an item';

      console.log('Duplicate found:', itemDescription);
      return new Response(
        JSON.stringify({
          error: 'duplicate',
          message: `You've already uploaded ${itemDescription} to your closet.`,
          existingItemId: duplicateCheck.id
        }),
        {
          status: 409, // Conflict status code
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Resize and optimize original image (max 1200px width for display)
    const originalKey = `original/${itemId}.webp`;
    const resizedOriginalResponse = await IMAGES
      .input(originalImage.stream())
      .transform({ width: 1200, fit: 'scale-down' })
      .output({ format: 'image/webp', quality: 85 });
    const resizedOriginalBuffer = await resizedOriginalResponse.response().arrayBuffer();
    await R2.put(originalKey, resizedOriginalBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });

    // Upload processed image to R2 (if provided) - resize to max 800px
    let processedKey = null;
    if (processedImage) {
      processedKey = `processed/${itemId}.webp`;
      const resizedProcessedResponse = await IMAGES
        .input(processedImage.stream())
        .transform({ width: 800, fit: 'scale-down' })
        .output({ format: 'image/webp', quality: 90 });
      const resizedProcessedBuffer = await resizedProcessedResponse.response().arrayBuffer();

      await R2.put(processedKey, resizedProcessedBuffer, {
        httpMetadata: {
          contentType: 'image/webp',
        },
      });
    }

    // Generate thumbnail (300px width)
    const thumbnailKey = `thumbnails/${itemId}.webp`;
    const sourceForThumbnail = processedImage || originalImage;
    const thumbnailResponse = await IMAGES
      .input(sourceForThumbnail.stream())
      .transform({ width: 300, fit: 'scale-down' })
      .output({ format: 'image/webp', quality: 80 });
    const thumbnailBuffer = await thumbnailResponse.response().arrayBuffer();
    await R2.put(thumbnailKey, thumbnailBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });

    // Save to D1 database
    // Use our API route to serve images from R2
    const originalImageUrl = `/api/images/${originalKey}`;
    const thumbnailUrl = `/api/images/${thumbnailKey}`;
    const backgroundRemovedUrl = processedKey
      ? `/api/images/${processedKey}`
      : null;

    console.log('Saving to DB - subcategory:', subcategory, 'color:', color, 'brand:', brand, 'size:', size, 'description:', description, 'notes:', notes, 'cost:', cost);

    await DB.prepare(
      `INSERT INTO clothing_items (
        id, user_id, category, subcategory, color, brand, size,
        description, notes,
        original_image_url, thumbnail_url, background_removed_url,
        image_hash,
        cost, date_purchased, store_purchased_from,
        favorite, times_worn, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      originalImageUrl,
      thumbnailUrl,
      backgroundRemovedUrl,
      originalImageHash,
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
