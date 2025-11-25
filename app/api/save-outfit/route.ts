import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const { topId, bottomId, shoesId, aiSuggestion, name, canvasLayout, isCanvasOutfit } = await request.json();

    // Canvas outfits must have a layout
    if (isCanvasOutfit && !canvasLayout) {
      return new Response(JSON.stringify({ error: 'Canvas outfits require a layout' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Regular outfits must have at least one item
    if (!isCanvasOutfit && !topId && !bottomId && !shoesId) {
      return new Response(JSON.stringify({ error: 'At least one item is required' }), {
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

    const outfitId = crypto.randomUUID();
    const now = Date.now();

    await DB.prepare(`
      INSERT INTO saved_outfits (id, user_id, top_id, bottom_id, shoes_id, name, ai_suggestion, created_at, canvas_layout, is_canvas_outfit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      outfitId,
      userId,
      topId || null,
      bottomId || null,
      shoesId || null,
      name || null,
      aiSuggestion || null,
      now,
      canvasLayout || null,
      isCanvasOutfit ? 1 : 0
    ).run();

    return new Response(JSON.stringify({
      success: true,
      outfitId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Save outfit error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to save outfit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
