import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Receive pre-processed images from client (all resizing done client-side)
    const processedImage = formData.get('processedImage') as Blob | null; // 512px WebP
    const thumbnailImage = formData.get('thumbnailImage') as Blob | null; // 200px WebP
    const category = formData.get('category') as string;
    const userId = formData.get('userId') as string || 'default-user'; // TODO: Replace with actual auth

    // Get perceptual hash from client
    const imageHash = formData.get('imageHash') as string;

    // Get AI metadata (full response for storage)
    const aiMetadataStr = formData.get('aiMetadata') as string || null;
    const aiRawResponse = aiMetadataStr; // Store the full JSON string

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

    if (!processedImage || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields (processedImage or category)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Cloudflare bindings from context
    const { env } = await getCloudflareContext();
    const R2 = env.CLOSET_IMAGES;
    const DB = env.DB;

    if (!R2 || !DB) {
      return new Response(JSON.stringify({ error: 'Storage bindings not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique ID for this item
    const itemId = crypto.randomUUID();
    const timestamp = Date.now();

    console.log('Received perceptual hash from client:', imageHash);
    console.log('Receiving pre-processed images: 512px processed + 200px thumbnail');

    // STEP 1: Upload processed image (512px WebP - background removed & cropped)
    const processedKey = `processed/${itemId}.webp`;
    const processedBuffer = await processedImage.arrayBuffer();
    console.log('Uploading processed image, size:', processedBuffer.byteLength, 'bytes');
    await R2.put(processedKey, processedBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });

    // STEP 2: Upload thumbnail (200px WebP)
    let thumbnailKey = `thumbnails/${itemId}.webp`;
    if (thumbnailImage) {
      const thumbnailBuffer = await thumbnailImage.arrayBuffer();
      console.log('Uploading thumbnail, size:', thumbnailBuffer.byteLength, 'bytes');
      await R2.put(thumbnailKey, thumbnailBuffer, {
        httpMetadata: {
          contentType: 'image/webp',
        },
      });
    } else {
      // Fallback: use processed image as thumbnail if not provided
      console.log('No thumbnail provided, using processed image');
      thumbnailKey = processedKey;
    }

    // Save to D1 database
    // Use our API route to serve images from R2
    // Note: No original image anymore - processed image IS the main image
    const thumbnailUrl = `/api/images/${thumbnailKey}`;
    const backgroundRemovedUrl = `/api/images/${processedKey}`;
    // Use processed image as the "original" since we don't store unprocessed originals
    const originalImageUrl = backgroundRemovedUrl;

    console.log('Saving to DB - subcategory:', subcategory, 'color:', color, 'brand:', brand, 'size:', size, 'description:', description, 'notes:', notes, 'cost:', cost);

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
      originalImageUrl,
      thumbnailUrl,
      backgroundRemovedUrl,
      imageHash, // Use perceptual hash from client
      aiRawResponse, // Store full AI JSON response
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
