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
      console.error('IMAGES binding not available - check wrangler.jsonc configuration');
      return new Response(JSON.stringify({ error: 'Images binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing image with Cloudflare Images API, size:', image.size);

    try {
      // STEP 1: Resize image to 600px (faster processing)
      // STEP 2: Remove background (creates transparent PNG)
      // Note: Cloudflare Images doesn't support auto-trim of transparent pixels
      const imageStream = image.stream();

      const result = await IMAGES
        .input(imageStream)
        .transform({
          width: 600,
          fit: 'scale-down',
          segment: 'foreground'
        })
        .output({ format: 'image/png' });

      console.log('Image processed: resized to 600px and background removed');

      // Return the processed image
      return result.response();
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
