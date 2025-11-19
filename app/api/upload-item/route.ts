import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const originalImage = formData.get('originalImage') as File; // Original from client
    const processedImage = formData.get('processedImage') as Blob | null; // Already resized/cropped by Cloudflare
    const category = formData.get('category') as string;
    const userId = formData.get('userId') as string || 'default-user'; // TODO: Replace with actual auth

    // Get perceptual hash from client
    const imageHash = formData.get('imageHash') as string;

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

    console.log('Received perceptual hash from client:', imageHash);
    console.log('Server-side image processing: resize original to 800px and thumbnail to 200px');

    // Process original image: create both 800px original and 200px thumbnail in one go
    // Using single IMAGES call to avoid multiple stream consumption issues
    const originalArrayBuffer = await originalImage.arrayBuffer();

    // STEP 1: Resize original image to 800px WebP
    const originalResized = await IMAGES
      .input(originalArrayBuffer)
      .transform({ width: 800, fit: 'scale-down' })
      .output({ format: 'image/webp', quality: 85 });

    const originalKey = `original/${itemId}.webp`;
    const originalResponse = await originalResized.response();
    await R2.put(originalKey, await originalResponse.arrayBuffer(), {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });

    // STEP 2: Create thumbnail (200px) from original image
    const thumbnailResized = await IMAGES
      .input(originalArrayBuffer)
      .transform({ width: 200, fit: 'scale-down' })
      .output({ format: 'image/webp', quality: 80 });

    const thumbnailKey = `thumbnails/${itemId}.webp`;
    const thumbnailResponse = await thumbnailResized.response();
    await R2.put(thumbnailKey, await thumbnailResponse.arrayBuffer(), {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });

    // STEP 3: Upload processed image if provided (already resized by Cloudflare at 600px PNG)
    let processedKey = null;
    if (processedImage) {
      processedKey = `processed/${itemId}.png`;
      const processedBuffer = await processedImage.arrayBuffer();
      await R2.put(processedKey, processedBuffer, {
        httpMetadata: {
          contentType: 'image/png',
        },
      });
    }

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
      imageHash, // Use perceptual hash from client
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
