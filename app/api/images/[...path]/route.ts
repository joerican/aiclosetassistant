import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { env } = await getCloudflareContext();
    const R2 = env.CLOSET_IMAGES;
    const IMAGES = env.IMAGES;

    if (!R2) {
      return new Response('R2 binding not available', { status: 500 });
    }

    // Parse URL for transform params
    const url = new URL(request.url);
    const width = url.searchParams.get('w');
    const rotate = url.searchParams.get('rotate');

    // Await params in Next.js 16
    const resolvedParams = await params;
    const key = resolvedParams.path.join('/');

    // Get the object from R2
    const object = await R2.get(key);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    // Get image data as ArrayBuffer (needed for transforms, also allows fallback)
    const imageData = await object.arrayBuffer();

    // If transform params specified and IMAGES binding available, transform on-the-fly
    const widthNum = width ? parseInt(width) : 0;
    const rotateNum = rotate ? parseInt(rotate) : 0;

    if (IMAGES && (widthNum > 0 || rotateNum)) {
      try {
        // Build transform options
        const transformOpts: any = {};
        if (widthNum > 0 && widthNum <= 1000) {
          transformOpts.width = widthNum;
          transformOpts.fit = 'scale-down';
        }
        if (rotateNum && [90, 180, 270].includes(rotateNum)) {
          transformOpts.rotate = rotateNum;
        }

        if (Object.keys(transformOpts).length > 0) {
          const transformed = await IMAGES
            .input(imageData)
            .transform(transformOpts)
            .output({ format: 'image/webp', quality: 80 });

          const response = await transformed.response();
          const blob = await response.blob();

          return new Response(blob, {
            headers: {
              'Content-Type': 'image/webp',
              'Cache-Control': 'public, max-age=3600',  // 1 hour cache for transformed images
            },
          });
        }
      } catch (transformError) {
        console.error('Transform error:', transformError);
        // Fall through to return original
      }
    }

    // Return original image
    return new Response(imageData, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    return new Response('Failed to fetch image', { status: 500 });
  }
}
