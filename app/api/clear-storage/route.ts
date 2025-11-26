import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';
import { validateApiKey } from '@/lib/api-auth';

export async function DELETE(request: Request) {
  // Validate API key for external requests
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    await requireAuth(); // Require authentication for security
    const { env } = await getCloudflareContext();
    const R2 = env.CLOSET_IMAGES;

    if (!R2) {
      return new Response(JSON.stringify({ error: 'R2 not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // List and delete all objects
    let deleted = 0;
    let cursor: string | undefined;

    do {
      const listed = await R2.list({ cursor, limit: 1000 });

      for (const obj of listed.objects) {
        await R2.delete(obj.key);
        deleted++;
      }

      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    return new Response(JSON.stringify({
      success: true,
      deleted,
      message: `Deleted ${deleted} objects from R2`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Clear storage error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to clear storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
