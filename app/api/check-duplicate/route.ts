import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const { imageHash, userId } = await request.json();

    if (!imageHash || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Cloudflare bindings from context
    const { env } = await getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicates
    const duplicateCheck = await DB.prepare(
      'SELECT id, subcategory, color, brand FROM clothing_items WHERE user_id = ? AND image_hash = ? LIMIT 1'
    ).bind(userId, imageHash).first();

    if (duplicateCheck) {
      return new Response(
        JSON.stringify({
          duplicate: true,
          existingItem: duplicateCheck,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        duplicate: false,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Duplicate check error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to check for duplicates',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
