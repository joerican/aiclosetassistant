interface Env {
  DB: D1Database;
  CLOSET_IMAGES: R2Bucket;
  AI: any;
  IMAGES: any;
  IMAGE_TRIM: { fetch: (request: Request) => Promise<Response> };
}

interface QueueMessage {
  itemId: string;
  pendingKey: string;
  userId: string;
  imageHash: string;
}

// Force cleanup all orphaned files and DB records (deletes everything with no DB match or not 'completed')
async function runCleanupAll(env: Env): Promise<string> {
  console.log('[cleanup-all] Starting full cleanup');

  let deletedPending = 0;
  let deletedItems = 0;
  let deletedThumbnails = 0;
  let deletedDbRecords = 0;

  // Delete ALL pending files
  const pendingObjects = await env.CLOSET_IMAGES.list({ prefix: 'pending/' });
  for (const obj of pendingObjects.objects) {
    await env.CLOSET_IMAGES.delete(obj.key);
    deletedPending++;
  }
  console.log(`[cleanup-all] Deleted ${deletedPending} pending files`);

  // Delete ALL items/ files that don't have 'completed' status in DB
  const itemsObjects = await env.CLOSET_IMAGES.list({ prefix: 'items/' });
  for (const obj of itemsObjects.objects) {
    const pathParts = obj.key.split('/');
    const filename = pathParts[pathParts.length - 1];
    const itemId = filename.split('.')[0];

    const item = await env.DB.prepare('SELECT status FROM clothing_items WHERE id = ?').bind(itemId).first() as { status: string } | null;
    if (!item || item.status !== 'completed') {
      await env.CLOSET_IMAGES.delete(obj.key);
      deletedItems++;
    }
  }
  console.log(`[cleanup-all] Deleted ${deletedItems} orphaned item files`);

  // Delete ALL thumbnails/ files that don't have 'completed' status in DB
  const thumbnailObjects = await env.CLOSET_IMAGES.list({ prefix: 'thumbnails/' });
  for (const obj of thumbnailObjects.objects) {
    const pathParts = obj.key.split('/');
    const filename = pathParts[pathParts.length - 1];
    const itemId = filename.split('.')[0];

    const item = await env.DB.prepare('SELECT status FROM clothing_items WHERE id = ?').bind(itemId).first() as { status: string } | null;
    if (!item || item.status !== 'completed') {
      await env.CLOSET_IMAGES.delete(obj.key);
      deletedThumbnails++;
    }
  }
  console.log(`[cleanup-all] Deleted ${deletedThumbnails} orphaned thumbnails`);

  // Delete ALL DB records that aren't 'completed'
  const result = await env.DB.prepare("DELETE FROM clothing_items WHERE status != 'completed'").run();
  deletedDbRecords = result.meta.changes || 0;
  console.log(`[cleanup-all] Deleted ${deletedDbRecords} non-completed DB records`);

  return `Full cleanup: ${deletedPending} pending, ${deletedItems} items, ${deletedThumbnails} thumbnails, ${deletedDbRecords} DB records`;
}

// Helper function to run cleanup logic
async function runCleanup(env: Env, thresholdMs: number = 4 * 60 * 60 * 1000): Promise<string> {
  console.log(`[cleanup] Starting cleanup with threshold ${thresholdMs / 1000}s`);

  try {
    const cutoffTime = Date.now() - thresholdMs;

    // Part 1: Clean up orphaned pending files in R2
    const pendingObjects = await env.CLOSET_IMAGES.list({ prefix: 'pending/' });
    let pendingFilesCleanedCount = 0;
    let pendingErrorCount = 0;

    for (const obj of pendingObjects.objects) {
      try {
        if (obj.uploaded.getTime() < cutoffTime) {
          const pathParts = obj.key.split('/');
          const filename = pathParts[pathParts.length - 1];
          const itemId = filename.split('.')[0];

          const item = await env.DB.prepare(
            'SELECT status FROM clothing_items WHERE id = ?'
          ).bind(itemId).first() as { status: string } | null;

          if (!item || item.status === 'failed' || (item.status !== 'processed' && item.status !== 'completed' && obj.uploaded.getTime() < cutoffTime)) {
            await env.CLOSET_IMAGES.delete(obj.key);
            pendingFilesCleanedCount++;
            console.log(`[cleanup] Deleted orphaned pending file: ${obj.key} (status: ${item?.status || 'no DB record'})`);
          }
        }
      } catch (err) {
        pendingErrorCount++;
        console.error(`[cleanup] Error processing pending file ${obj.key}:`, err);
      }
    }

    // Part 2: Clean up unconfirmed 'processed' items older than 4 hours
    const unconfirmedItems = await env.DB.prepare(`
      SELECT id, original_image_url, thumbnail_url, created_at
      FROM clothing_items
      WHERE status = 'processed' AND created_at < ?
    `).bind(cutoffTime).all() as { results: Array<{ id: string; original_image_url: string; thumbnail_url: string; created_at: number }> };

    let unconfirmedItemsCleanedCount = 0;
    let unconfirmedErrorCount = 0;

    for (const item of unconfirmedItems.results) {
      try {
        const deletePromises = [];
        if (item.original_image_url) {
          const key = item.original_image_url.split('/images/')[1];
          if (key) deletePromises.push(env.CLOSET_IMAGES.delete(key));
        }
        if (item.thumbnail_url && item.thumbnail_url !== item.original_image_url) {
          const key = item.thumbnail_url.split('/images/')[1];
          if (key) deletePromises.push(env.CLOSET_IMAGES.delete(key));
        }

        await Promise.all(deletePromises);
        await env.DB.prepare('DELETE FROM clothing_items WHERE id = ?').bind(item.id).run();

        unconfirmedItemsCleanedCount++;
        console.log(`[cleanup] Deleted unconfirmed processed item: ${item.id} (age: ${((Date.now() - item.created_at) / 1000 / 60).toFixed(0)} min)`);
      } catch (err) {
        unconfirmedErrorCount++;
        console.error(`[cleanup] Error deleting unconfirmed item ${item.id}:`, err);
      }
    }

    // Part 3: Clean up orphaned files in items/ folder (files with no DB record)
    const itemsObjects = await env.CLOSET_IMAGES.list({ prefix: 'items/' });
    let orphanedItemsCleanedCount = 0;
    let orphanedErrorCount = 0;

    for (const obj of itemsObjects.objects) {
      try {
        const pathParts = obj.key.split('/');
        const filename = pathParts[pathParts.length - 1];
        const itemId = filename.split('.')[0];

        const item = await env.DB.prepare(
          'SELECT id FROM clothing_items WHERE id = ?'
        ).bind(itemId).first();

        if (!item) {
          await env.CLOSET_IMAGES.delete(obj.key);
          orphanedItemsCleanedCount++;
          console.log(`[cleanup] Deleted orphaned item file: ${obj.key}`);
        }
      } catch (err) {
        orphanedErrorCount++;
        console.error(`[cleanup] Error processing item file ${obj.key}:`, err);
      }
    }

    // Part 4: Clean up orphaned thumbnails/ folder
    const thumbnailObjects = await env.CLOSET_IMAGES.list({ prefix: 'thumbnails/' });
    let orphanedThumbnailsCleanedCount = 0;

    for (const obj of thumbnailObjects.objects) {
      try {
        const pathParts = obj.key.split('/');
        const filename = pathParts[pathParts.length - 1];
        const itemId = filename.split('.')[0];

        const item = await env.DB.prepare(
          'SELECT id FROM clothing_items WHERE id = ?'
        ).bind(itemId).first();

        if (!item) {
          await env.CLOSET_IMAGES.delete(obj.key);
          orphanedThumbnailsCleanedCount++;
          console.log(`[cleanup] Deleted orphaned thumbnail: ${obj.key}`);
        }
      } catch (err) {
        console.error(`[cleanup] Error processing thumbnail ${obj.key}:`, err);
      }
    }

    const summary = `Cleanup finished. Pending: ${pendingFilesCleanedCount}, Unconfirmed: ${unconfirmedItemsCleanedCount}, Orphaned items: ${orphanedItemsCleanedCount}, Orphaned thumbnails: ${orphanedThumbnailsCleanedCount}`;
    console.log(`[cleanup] ${summary}`);
    return summary;

  } catch (error) {
    console.error('[cleanup] Fatal error during cleanup:', error);
    throw error;
  }
}

export default {
  // HTTP handler - admin endpoints require secret key
  // Usage: curl "https://image-processor.../cleanup?key=YOUR_SECRET"
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Admin secret - set via wrangler secret put ADMIN_KEY
    const adminKey = (env as any).ADMIN_KEY;
    const providedKey = url.searchParams.get('key');

    // Public health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('Image Processor Worker is running.', { status: 200 });
    }

    // All other endpoints require admin key
    if (!adminKey || providedKey !== adminKey) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (url.pathname === '/cleanup') {
      try {
        const result = await runCleanup(env);
        return new Response(JSON.stringify({ success: true, message: result }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/cleanup-now') {
      // Force cleanup everything regardless of age
      const result = await runCleanupAll(env);
      return new Response(JSON.stringify({ success: true, message: result }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/list') {
      const items = await env.CLOSET_IMAGES.list({ prefix: 'items/' });
      const thumbnails = await env.CLOSET_IMAGES.list({ prefix: 'thumbnails/' });
      const pending = await env.CLOSET_IMAGES.list({ prefix: 'pending/' });
      return new Response(JSON.stringify({
        items: items.objects.map(o => o.key),
        thumbnails: thumbnails.objects.map(o => o.key),
        pending: pending.objects.map(o => o.key),
        counts: {
          items: items.objects.length,
          thumbnails: thumbnails.objects.length,
          pending: pending.objects.length
        }
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Unknown endpoint', { status: 404 });
  },

  // Scheduled cleanup of orphaned files and unconfirmed items older than 4 hours
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    await runCleanup(env);
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { itemId, pendingKey, userId, imageHash } = message.body;

      try {
        console.log(`[image-processor] Processing ${itemId}`);

        // Update status to processing
        await env.DB.prepare(`
          UPDATE clothing_items SET status = 'processing' WHERE id = ?
        `).bind(itemId).run();

        // Get original from R2
        const original = await env.CLOSET_IMAGES.get(pendingKey);
        if (!original) {
          throw new Error(`Original not found: ${pendingKey}`);
        }
        const imageBuffer = await original.arrayBuffer();
        console.log(`[image-processor] Got original: ${(imageBuffer.byteLength / 1024).toFixed(1)}KB`);

        // PARALLEL PROCESSING: Run BG removal + trim AND AI analysis simultaneously
        const [webpBuffer, aiResult] = await Promise.all([
          // Path 1: BG removal + trim (for display)
          (async () => {
            // Step 1: BG removal + resize to 800px (with retry if no alpha)
            let bgRemovedBuffer: ArrayBuffer;

            for (let bgAttempt = 1; bgAttempt <= 2; bgAttempt++) {
              const result = await env.IMAGES
                .input(imageBuffer)
                .transform({
                  width: 800,
                  fit: 'scale-down',
                  segment: 'foreground'
                })
                .output({ format: 'image/png' });

              const response = await result.response();
              bgRemovedBuffer = await response.arrayBuffer();
              console.log(`[image-processor] BG removed PNG (attempt ${bgAttempt}): ${(bgRemovedBuffer.byteLength / 1024).toFixed(1)}KB`);

              // Check if PNG has alpha channel (color type at byte 25: 4 or 6 = has alpha)
              const pngBytes = new Uint8Array(bgRemovedBuffer);
              const colorType = pngBytes[25];
              const hasAlpha = colorType === 4 || colorType === 6;

              if (hasAlpha) {
                console.log(`[image-processor] Alpha channel detected (colorType=${colorType})`);
                break;
              } else {
                console.log(`[image-processor] No alpha channel (colorType=${colorType}), ${bgAttempt === 1 ? 'retrying...' : 'proceeding anyway'}`);
              }
            }

            // Step 2: Send to IMAGE_TRIM worker for auto-crop + WebP conversion
            const trimResponse = await env.IMAGE_TRIM.fetch(new Request('https://image-trim/', {
              method: 'POST',
              body: bgRemovedBuffer,
              headers: { 'Content-Type': 'image/png' }
            }));

            if (!trimResponse.ok) {
              const errorText = await trimResponse.text();
              console.error('[image-processor] IMAGE_TRIM failed:', errorText);
              throw new Error('Image trimming failed');
            }

            const trimmedWebP = await trimResponse.arrayBuffer();
            console.log(`[image-processor] Trimmed WebP: ${(trimmedWebP.byteLength / 1024).toFixed(1)}KB`);
            return trimmedWebP;
          })(),

          // Path 2: AI analysis on original image (runs in parallel)
          (async () => {
            // Use original 600px image for AI (uploaded by client)
            const aiBuffer = imageBuffer;
            console.log(`[image-processor] AI input (600px): ${(aiBuffer.byteLength / 1024).toFixed(1)}KB`);

            // Convert to base64 in chunks
            const uint8Array = new Uint8Array(aiBuffer);
            let base64 = '';
            const chunkSize = 8192;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.slice(i, i + chunkSize);
              base64 += String.fromCharCode.apply(null, Array.from(chunk));
            }
            const imageBase64 = btoa(base64);

            // AI analysis with retries
            for (let attempt = 1; attempt <= 2; attempt++) {
              try {
                console.log(`[image-processor] AI attempt ${attempt}...`);

                const aiResponse = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
                  messages: [{
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: `Clothing analysis. Output valid JSON only.

Example format:
{"category":"tops","subcategory":"t-shirt","colors":["navy blue"],"brand":null,"fit":"regular","style":"casual","season":"all","material":"cotton","boldness":"subtle","description":"plain crew neck tee","tags":["basic","everyday"]}

category: tops/bottoms/shoes/outerwear/accessories
subcategory for tops: t-shirt/shirt/button-up/button-down/blouse/sweater/hoodie/tank top/cardigan/polo
fit: slim/regular/relaxed/oversized/unknown
style: casual/streetwear/sporty/formal/loungewear/unknown
season: summer/fall/winter/spring/all
material: cotton/denim/leather/knit/wool/synthetic/mixed/unknown
boldness: subtle/moderate/statement

CRITICAL REQUIREMENTS:
1. "colors" field is REQUIRED and must contain at least one color. Never return an empty array.
2. "description" field is REQUIRED and must be a short phrase describing the item (e.g., "black leather boots", "white cotton t-shirt", "blue denim jeans").
3. For shoes use category "shoes" with subcategory like sneakers/boots/sandals.
4. For dress shirts or formal shirts with buttons use "button-up" as subcategory.
5. BRAND DETECTION: Look carefully for ANY visible text, logos, or labels on the clothing (tags, printed text, embroidered logos, waistbands, collars, pockets). Common brands include: Nike, Adidas, Gap, Old Navy, H&M, Zara, Uniqlo, Express, American Eagle, Hollister, Forever 21, Target, Walmart, etc. If you see ANY brand text or logo, include it in the "brand" field. Only use null if you truly cannot find any brand indicators.

Analyze the image carefully for brand labels and respond with JSON only:`
                      },
                      {
                        type: 'image_url',
                        image_url: { url: `data:image/webp;base64,${imageBase64}` }
                      }
                    ]
                  }],
                  max_tokens: 300,
                }) as any;

                const responseData = aiResponse.response;
                console.log(`[image-processor] AI response type: ${typeof responseData}`);
                console.log(`[image-processor] AI response: ${typeof responseData === 'string' ? responseData.substring(0, 200) : JSON.stringify(responseData).substring(0, 200)}`);

                if (typeof responseData === 'object' && responseData !== null) {
                  return responseData;
                } else if (typeof responseData === 'string') {
                  const jsonMatch = responseData.match(/\{[\s\S]*\}/);
                  if (jsonMatch) return JSON.parse(jsonMatch[0]);
                }
              } catch (err) {
                console.error(`[image-processor] AI error (attempt ${attempt}):`, err);
                if (attempt === 2) break;
              }
            }
            return null;
          })()
        ]);

        // Store processed image in R2 - KEEP IN PENDING until user confirms save
        const processedKey = `pending/${userId}/${itemId}.webp`;
        await env.CLOSET_IMAGES.put(processedKey, webpBuffer, {
          httpMetadata: { contentType: 'image/webp' },
        });
        console.log(`[image-processor] Stored processed image in R2: ${processedKey}`);

        // Update DB with results - URL points to pending location
        const imageUrl = `/api/images/${processedKey}`;

        // Format colors for storage - handle both string array and object array
        let colorNames = null;
        if (aiResult?.colors && Array.isArray(aiResult.colors) && aiResult.colors.length > 0) {
          colorNames = aiResult.colors
            .map((c: any) => typeof c === 'string' ? c : c.name)
            .filter(Boolean)
            .join(', ') || null;
        }

        // Fallback: If AI didn't provide colors, use a default based on category
        if (!colorNames && aiResult?.category) {
          colorNames = 'unknown';
          console.log(`[image-processor] Warning: No colors detected, using fallback: ${colorNames}`);
        }

        // Normalize season field (AI sometimes returns "all-season" instead of "all")
        let seasonValue = aiResult?.season || null;
        if (seasonValue === 'all-season') {
          seasonValue = 'all';
        }

        // Generate fallback description if AI didn't provide one or returned "None"
        let descriptionValue = aiResult?.description || null;
        if (!descriptionValue || descriptionValue === 'None' || descriptionValue.trim() === '') {
          // Generate simple description from available data: "color subcategory"
          const parts = [];
          if (colorNames && colorNames !== 'unknown') {
            parts.push(colorNames.split(',')[0].trim().toLowerCase());
          }
          if (aiResult?.subcategory) {
            parts.push(aiResult.subcategory.toLowerCase());
          } else if (aiResult?.category) {
            parts.push(aiResult.category.toLowerCase());
          }
          descriptionValue = parts.length > 0 ? parts.join(' ') : 'clothing item';
          console.log(`[image-processor] Generated fallback description: ${descriptionValue}`);
        }

        // Normalize button-down to button-up
        let subcategoryValue = aiResult?.subcategory || null;
        if (subcategoryValue === 'button-down') {
          subcategoryValue = 'button-up';
          console.log(`[image-processor] Normalized button-down to button-up`);
        }

        await env.DB.prepare(`
          UPDATE clothing_items SET
            status = 'processed',
            original_image_url = ?,
            thumbnail_url = ?,
            category = ?,
            subcategory = ?,
            color = ?,
            brand = ?,
            description = ?,
            tags = ?,
            fit = ?,
            style = ?,
            season = ?,
            material = ?,
            boldness = ?
          WHERE id = ?
        `).bind(
          imageUrl,
          imageUrl, // Use same as thumbnail for now
          aiResult?.category || 'tops',
          subcategoryValue,
          colorNames,
          aiResult?.brand || null,
          descriptionValue,
          aiResult?.tags ? JSON.stringify(aiResult.tags) : null,
          aiResult?.fit || null,
          aiResult?.style || null,
          seasonValue,
          aiResult?.material || null,
          aiResult?.boldness || null,
          itemId
        ).run();

        // Delete ORIGINAL JPEG from pending (keep the processed WebP for user to review)
        await env.CLOSET_IMAGES.delete(pendingKey);
        console.log(`[image-processor] Deleted original JPEG: ${pendingKey}`);

        console.log(`[image-processor] Completed ${itemId}`);
        message.ack();

      } catch (error) {
        console.error(`[image-processor] Error processing ${itemId}:`, error);

        // Update status to failed
        await env.DB.prepare(`
          UPDATE clothing_items SET
            status = 'failed',
            error_message = ?
          WHERE id = ?
        `).bind(
          error instanceof Error ? error.message : 'Unknown error',
          itemId
        ).run();

        // Clean up pending file on permanent failure
        try {
          await env.CLOSET_IMAGES.delete(pendingKey);
          console.log(`[image-processor] Deleted pending file after failure: ${pendingKey}`);
        } catch (cleanupError) {
          console.error(`[image-processor] Failed to delete pending file ${pendingKey}:`, cleanupError);
        }

        // Retry will happen automatically due to queue config
        message.retry();
      }
    }
  },
};
