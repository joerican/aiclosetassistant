import { PhotonImage, crop } from '@cf-wasm/photon';

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const pngBuffer = await request.arrayBuffer();
      const pngData = new Uint8Array(pngBuffer);

      console.log(`[image-trim] Received ${(pngBuffer.byteLength / 1024).toFixed(1)}KB`);

      // Load image with Photon WASM
      const image = PhotonImage.new_from_byteslice(pngData);
      const width = image.get_width();
      const height = image.get_height();

      // Get raw RGBA pixels
      const pixels = image.get_raw_pixels();

      // Find bounding box of non-transparent pixels
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (width * y + x) * 4;
          const alpha = pixels[idx + 3];
          if (alpha > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Check if we found any content
      if (maxX <= minX || maxY <= minY) {
        console.log('[image-trim] No content found, returning original');
        const webpBytes = image.get_bytes_webp();
        image.free();
        return new Response(webpBytes, {
          headers: { 'Content-Type': 'image/webp' },
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

      console.log(`[image-trim] Cropping from ${width}x${height} to ${cropWidth}x${cropHeight}`);

      // Crop the image - crop(img, x1, y1, x2, y2)
      const cropped = crop(image, minX, minY, maxX + 1, maxY + 1);

      // Convert to WebP
      const webpBytes = cropped.get_bytes_webp();

      // Free memory
      image.free();
      cropped.free();

      console.log(`[image-trim] Output: ${(webpBytes.length / 1024).toFixed(1)}KB`);

      return new Response(webpBytes, {
        headers: { 'Content-Type': 'image/webp' },
      });
    } catch (error) {
      console.error('[image-trim] Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to trim image',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
