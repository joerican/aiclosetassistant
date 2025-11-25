import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request: Request) {
  try {
    const userId = await requireAuth();

    const { outfitId } = await request.json();

    if (!outfitId) {
      return new Response(JSON.stringify({ error: 'Missing outfit ID' }), {
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

    await DB.prepare(
      'DELETE FROM saved_outfits WHERE id = ? AND user_id = ?'
    ).bind(outfitId, userId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Delete outfit error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete outfit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
