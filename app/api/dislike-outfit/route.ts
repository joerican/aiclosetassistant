import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const { topId, bottomId, shoesId } = await request.json();

    if (!topId || !bottomId || !shoesId) {
      return new Response(JSON.stringify({ error: 'Missing required item IDs' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { env } = await getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dislikeId = crypto.randomUUID();
    const now = Date.now();

    await DB.prepare(`
      INSERT INTO disliked_outfits (id, user_id, top_id, bottom_id, shoes_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(dislikeId, userId, topId, bottomId, shoesId, now).run();

    return new Response(JSON.stringify({
      success: true,
      dislikeId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Dislike outfit error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to dislike outfit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
