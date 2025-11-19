import { getCloudflareContext } from '@opennextjs/cloudflare';

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
      return new Response(JSON.stringify({ error: 'Images binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing image with Cloudflare Images API, size:', image.size);

    // Use Cloudflare Images API to remove background
    // BiRefNet model via segment=foreground
    // Note: input() requires a ReadableStream, not ArrayBuffer
    const imageStream = image.stream();

    const result = await IMAGES
      .input(imageStream)
      .transform({ segment: 'foreground' })
      .output({ format: 'image/png' });

    console.log('Background removal complete');

    // Return the processed image with transparent background
    return result.response();
  } catch (error) {
    console.error('Background removal error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to remove background',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
