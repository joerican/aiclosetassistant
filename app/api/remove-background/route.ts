import { getCloudflareContext } from '@opennextjs/cloudflare';
import { decode } from 'fast-png';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { env } = await getCloudflareContext();
    const IMAGES = env.IMAGES;

    if (!IMAGES) {
      console.error('IMAGES binding not available - check wrangler.jsonc configuration');
      return new Response(JSON.stringify({ error: 'Images binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[remove-background] Received: ${image.name}, type: ${image.type}, size: ${(image.size / 1024).toFixed(1)}KB`);

    try {
      // Remove background
      const imageData = await image.arrayBuffer();

      const result = await IMAGES
        .input(imageData)
        .transform({
          segment: 'foreground'
        })
        .output({ format: 'image/png' });

      const response = await result.response();
      const pngBuffer = await response.arrayBuffer();

      console.log('[remove-background] Background removed, now auto-trimming...');

      // Parse PNG and find bounding box of non-transparent pixels
      const png = decode(new Uint8Array(pngBuffer));
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
          if (alpha > 10) { // Threshold to ignore near-transparent pixels
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Check if we found any content
      if (maxX <= minX || maxY <= minY) {
        console.log('[remove-background] No content found, returning original');
        return new Response(pngBuffer, {
          headers: { 'Content-Type': 'image/png' },
        });
      }

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
          // Content is too small, expand the crop area proportionally
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

      console.log(`[remove-background] Cropping from ${width}x${height} to ${cropWidth}x${cropHeight} (${minX},${minY} to ${maxX},${maxY})`);

      // Use Cloudflare Images API to crop (much more efficient than re-encoding PNG)
      const cropResult = await IMAGES
        .input(pngBuffer)
        .transform({
          trim: { left: minX, top: minY, right: width - maxX - 1, bottom: height - maxY - 1 }
        })
        .output({ format: 'image/png' });

      const cropResponse = await cropResult.response();
      const croppedBuffer = await cropResponse.arrayBuffer();
      console.log(`[remove-background] Trimmed image size: ${(croppedBuffer.byteLength / 1024).toFixed(1)}KB`);

      return new Response(croppedBuffer, {
        headers: {
          'Content-Type': 'image/png',
        },
      });
    } catch (transformError) {
      console.error('Transform error details:', transformError);
      console.error('Error type:', typeof transformError);
      console.error('Error message:', transformError instanceof Error ? transformError.message : String(transformError));

      // Re-throw to be caught by outer catch
      throw transformError;
    }
  } catch (error) {
    console.error('Background removal error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return new Response(
      JSON.stringify({
        error: 'Failed to remove background',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
