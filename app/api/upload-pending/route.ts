import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';
import { validateApiKey } from '@/lib/api-auth';

export async function POST(request: Request) {
  // Validate API key for external requests
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const userId = await requireAuth();

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const imageHash = formData.get('imageHash') as string;

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { env } = await getCloudflareContext();
    const DB = env.DB;
    const R2 = env.CLOSET_IMAGES;
    const QUEUE = (env as any).IMAGE_QUEUE as { send: (message: any) => Promise<void> };

    if (!DB || !R2 || !QUEUE) {
      return new Response(JSON.stringify({ error: 'Bindings not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const itemId = crypto.randomUUID();
    console.log(`[upload-pending] Starting for ${itemId}, size: ${(image.size / 1024).toFixed(1)}KB`);

    // Get file extension from mime type
    const ext = image.type.split('/')[1] || 'jpg';
    const pendingKey = `pending/${userId}/${itemId}.${ext}`;

    // Store original in R2 pending folder
    const imageBuffer = await image.arrayBuffer();
    await R2.put(pendingKey, imageBuffer, {
      httpMetadata: {
        contentType: image.type,
      },
    });
    console.log(`[upload-pending] Stored in R2: ${pendingKey}`);

    // Create DB record with pending status
    // Use placeholders for required NOT NULL fields - will be updated by queue processor
    // Category must be valid value due to CHECK constraint, will be overwritten by AI
    const now = Date.now();
    await DB.prepare(`
      INSERT INTO clothing_items (
        id, user_id, image_hash, status, category,
        original_image_url, thumbnail_url, created_at, updated_at
      ) VALUES (?, ?, ?, 'pending', 'tops', 'pending', 'pending', ?, ?)
    `).bind(itemId, userId, imageHash, now, now).run();
    console.log(`[upload-pending] Created DB record with pending status`);

    // Send to queue for processing
    await QUEUE.send({
      itemId,
      pendingKey,
      userId,
      imageHash,
    });
    console.log(`[upload-pending] Sent to queue`);

    return new Response(JSON.stringify({
      success: true,
      itemId,
      status: 'pending',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[upload-pending] Error:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
