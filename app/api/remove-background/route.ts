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

    // Get Cloudflare AI binding from the environment
    const env = (process as any).env;
    const AI = env.AI;

    if (!AI) {
      return new Response(JSON.stringify({ error: 'AI binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert image to array buffer
    const imageBuffer = await image.arrayBuffer();

    // Use Cloudflare AI to remove background
    // Model: @cf/cloudflare/rembg (background removal)
    const result = await AI.run('@cf/cloudflare/rembg', {
      image: Array.from(new Uint8Array(imageBuffer)),
    });

    // Return the processed image
    return new Response(result, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
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
