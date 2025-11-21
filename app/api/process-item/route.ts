import { getCloudflareContext } from '@opennextjs/cloudflare';
import { decode } from 'fast-png';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const imageHash = formData.get('imageHash') as string;
    const userId = formData.get('userId') as string || 'default-user';

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

    if (!IMAGES || !AI || !R2) {
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

    // Auto-trim transparent pixels
    const png = decode(new Uint8Array(bgRemovedBuffer));
    const { width, height, data } = png;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    // Find bounding box of non-transparent pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    let processedResult: ArrayBuffer;

    // Check if we found any content
    if (maxX <= minX || maxY <= minY) {
      console.log('[process-item] No content found, using original');
      processedResult = bgRemovedBuffer;
    } else {
      // Add small padding (5% of dimensions)
      const padding = Math.max(5, Math.floor(Math.min(maxX - minX, maxY - minY) * 0.05));
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width - 1, maxX + padding);
      maxY = Math.min(height - 1, maxY + padding);

      let cropWidth = maxX - minX + 1;
      let cropHeight = maxY - minY + 1;

      // Ensure minimum dimensions (at least 300px on shortest side)
      const MIN_DIMENSION = 300;
      if (cropWidth < MIN_DIMENSION || cropHeight < MIN_DIMENSION) {
        const scale = MIN_DIMENSION / Math.min(cropWidth, cropHeight);
        if (scale > 1) {
          const expandX = Math.floor((cropWidth * scale - cropWidth) / 2);
          const expandY = Math.floor((cropHeight * scale - cropHeight) / 2);
          minX = Math.max(0, minX - expandX);
          maxX = Math.min(width - 1, maxX + expandX);
          minY = Math.max(0, minY - expandY);
          maxY = Math.min(height - 1, maxY + expandY);
          cropWidth = maxX - minX + 1;
          cropHeight = maxY - minY + 1;
        }
      }

      console.log(`[process-item] Cropping from ${width}x${height} to ${cropWidth}x${cropHeight}`);

      // Use Cloudflare Images API to crop (much more efficient than re-encoding PNG)
      const cropResult = await IMAGES
        .input(bgRemovedBuffer)
        .transform({
          trim: { left: minX, top: minY, right: width - maxX - 1, bottom: height - maxY - 1 }
        })
        .output({ format: 'image/png' });

      const cropResponse = await cropResult.response();
      processedResult = await cropResponse.arrayBuffer();
      console.log(`[process-item] Trimmed PNG: ${(processedResult.byteLength / 1024).toFixed(1)}KB`);
    }

    // Convert PNG to WebP for storage
    const webpResult = await IMAGES
      .input(processedResult)
      .transform({
        width: 512,
        fit: 'scale-down'
      })
      .output({ format: 'image/webp', quality: 90 });

    const webpResponse = await webpResult.response();
    const webpBuffer = await webpResponse.arrayBuffer();
    console.log(`[process-item] WebP for storage: ${(webpBuffer.byteLength / 1024).toFixed(1)}KB`);

    // Store in R2
    const imageKey = `items/${itemId}.webp`;
    await R2.put(imageKey, webpBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
    });
    console.log(`[process-item] Stored in R2: ${imageKey}`);

    // Step 2: AI analysis using the BG-removed image (cleaner input = better results)
    let aiResult = null;

    // Convert processed image to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(processedResult);
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64 += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const imageBase64 = btoa(base64);
    console.log('[process-item] Base64 length:', imageBase64.length);

    // Try AI analysis with 1 automatic retry
    for (let attempt = 1; attempt <= 2; attempt++) {
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
        if (attempt === 2) {
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
