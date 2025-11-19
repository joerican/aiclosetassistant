import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { env } = await getCloudflareContext();
    const R2 = env.CLOSET_IMAGES;

    if (!R2) {
      return new Response('R2 binding not available', { status: 500 });
    }

    // Await params in Next.js 16
    const resolvedParams = await params;

    // Join the path segments (e.g., ['original', 'abc123.jpg'] -> 'original/abc123.jpg')
    const key = resolvedParams.path.join('/');

    // Get the object from R2
    const object = await R2.get(key);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    // Return the image with proper headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    return new Response('Failed to fetch image', { status: 500 });
  }
}
