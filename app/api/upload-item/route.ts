export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const originalImage = formData.get('originalImage') as File;
    const processedImage = formData.get('processedImage') as File;
    const category = formData.get('category') as string;
    const userId = formData.get('userId') as string || 'default-user'; // TODO: Replace with actual auth

    if (!originalImage || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Cloudflare bindings
    const env = (process as any).env;
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

    // Upload original image to R2
    const originalKey = `original/${itemId}.${originalImage.name.split('.').pop() || 'jpg'}`;
    const originalBuffer = await originalImage.arrayBuffer();
    await R2.put(originalKey, originalBuffer, {
      httpMetadata: {
        contentType: originalImage.type,
      },
    });

    // Upload processed image to R2 (if provided)
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

    // Generate thumbnail (use processed if available, otherwise original)
    const thumbnailKey = `thumbnails/${itemId}.jpg`;
    const thumbnailBuffer = processedImage
      ? await processedImage.arrayBuffer()
      : await originalImage.arrayBuffer();
    await R2.put(thumbnailKey, thumbnailBuffer, {
      httpMetadata: {
        contentType: processedImage ? 'image/png' : originalImage.type,
      },
    });

    // Save to D1 database
    const originalImageUrl = `https://closet-images.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/${originalKey}`;
    const thumbnailUrl = `https://closet-images.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/${thumbnailKey}`;
    const backgroundRemovedUrl = processedKey
      ? `https://closet-images.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/${processedKey}`
      : null;

    await DB.prepare(
      `INSERT INTO clothing_items (
        id, user_id, category, original_image_url, thumbnail_url,
        background_removed_url, favorite, times_worn, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      itemId,
      userId,
      category,
      originalImageUrl,
      thumbnailUrl,
      backgroundRemovedUrl,
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
