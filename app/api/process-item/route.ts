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
    const IMAGES = env.IMAGES;
    const AI = env.AI;
    const R2 = env.CLOSET_IMAGES;
    const IMAGE_TRIM = (env as any).IMAGE_TRIM as { fetch: (request: Request) => Promise<Response> };

    if (!IMAGES || !AI || !R2 || !IMAGE_TRIM) {
      return new Response(JSON.stringify({ error: 'Bindings not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const itemId = crypto.randomUUID();
    console.log(`[process-item] Starting for ${itemId}, size: ${(image.size / 1024).toFixed(1)}KB`);

    // Get image as ArrayBuffer for reuse
    const imageBuffer = await image.arrayBuffer();

    // Step 1: BG removal + resize → PNG (for client-side transparent cropping)
    const result = await IMAGES
      .input(imageBuffer)
      .transform({
        width: 512,
        fit: 'scale-down',
        segment: 'foreground'
      })
      .output({ format: 'image/png' });

    const response = await result.response();
    const bgRemovedBuffer = await response.arrayBuffer();
    console.log(`[process-item] BG removed PNG: ${(bgRemovedBuffer.byteLength / 1024).toFixed(1)}KB`);

    // Use IMAGE_TRIM service for auto-trim (offloads CPU-intensive work to separate Worker with WASM)
    const trimResponse = await IMAGE_TRIM.fetch(new Request('https://image-trim/', {
      method: 'POST',
      body: bgRemovedBuffer,
      headers: { 'Content-Type': 'image/png' }
    }));

    if (!trimResponse.ok) {
      console.error('[process-item] IMAGE_TRIM failed:', await trimResponse.text());
      throw new Error('Image trimming failed');
    }

    // IMAGE_TRIM returns WebP directly
    const webpBuffer = await trimResponse.arrayBuffer();
    console.log(`[process-item] Trimmed WebP: ${(webpBuffer.byteLength / 1024).toFixed(1)}KB`);

    // Store in R2
    const imageKey = `items/${itemId}.webp`;
    await R2.put(imageKey, webpBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });
    console.log(`[process-item] Stored in R2: ${imageKey}`);

    // Step 2: AI analysis using the trimmed WebP image
    let aiResult = null;

    // Convert trimmed WebP to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(webpBuffer);
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64 += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const imageBase64 = btoa(base64);
    console.log('[process-item] Base64 length:', imageBase64.length);

    // Try AI analysis with 2 automatic retries
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[process-item] AI analysis attempt ${attempt}...`);

        const aiResponse = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this clothing item image and return ONLY a JSON object with these fields:
- category: one of "tops", "bottoms", "shoes", "outerwear", "accessories"
- subcategory: specific type (e.g., "t-shirt", "jeans", "sneakers")
- colors: array of objects with color name, RGB values, and percentage, max 8 colors (e.g., [{"name": "black", "rgb": [0, 0, 0], "percent": 60}, {"name": "navy blue", "rgb": [31, 31, 112], "percent": 40}]). Percentages must sum to 100.
- brand: brand name if visible, or null
- description: brief 1-sentence description
- tags: array of 3-5 descriptive tags

Return ONLY valid JSON, no other text.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/webp;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
        }) as any;

        console.log('[process-item] AI raw response:', JSON.stringify(aiResponse));

        const responseData = (aiResponse as any).response;

        // Handle both string and object responses
        if (typeof responseData === 'object' && responseData !== null) {
          // Response is already parsed JSON
          aiResult = responseData;
          console.log('[process-item] AI parsed successfully (object)');
          break; // Success, exit retry loop
        } else if (typeof responseData === 'string') {
          // Response is a string, need to extract JSON
          const jsonMatch = responseData.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResult = JSON.parse(jsonMatch[0]);
            console.log('[process-item] AI parsed successfully (string)');
            break; // Success, exit retry loop
          } else {
            console.log('[process-item] No JSON found in AI response');
          }
        } else {
          console.log('[process-item] Unexpected response type:', typeof responseData);
        }

        // If we get here without breaking, the result was empty/invalid
        if (attempt === 1 && !aiResult) {
          console.log('[process-item] Empty result, retrying...');
        }
      } catch (err) {
        console.error(`[process-item] AI analysis error (attempt ${attempt}):`, err);
        if (attempt === 3) {
          // Final attempt failed, continue without AI data
          break;
        }
      }
    }

    const imageUrl = `/api/images/${imageKey}`;

    return new Response(JSON.stringify({
      success: true,
      itemId,
      imageUrl,
      imageHash,
      metadata: aiResult,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[process-item] Error:', error);
    return new Response(JSON.stringify({
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
