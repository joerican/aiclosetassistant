import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request: Request) {
  try {
    const userId = await requireAuth();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return new Response(JSON.stringify({ error: 'Missing itemId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Cloudflare bindings from context
    const { env } = await getCloudflareContext();
    const R2 = env.CLOSET_IMAGES;
    const DB = env.DB;

    if (!R2 || !DB) {
      return new Response(JSON.stringify({ error: 'Storage bindings not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First, get the item to retrieve image paths
    const item = await DB.prepare(
      'SELECT * FROM clothing_items WHERE id = ? AND user_id = ?'
    ).bind(itemId, userId).first();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete images from R2
    // Extract the file paths from URLs
    const deleteImagePromises = [];

    if (item.original_image_url) {
      const originalPath = item.original_image_url.split('/images/')[1];
      if (originalPath) {
        deleteImagePromises.push(R2.delete(originalPath));
      }
    }

    if (item.background_removed_url) {
      const processedPath = item.background_removed_url.split('/images/')[1];
      if (processedPath) {
        deleteImagePromises.push(R2.delete(processedPath));
      }
    }

    if (item.thumbnail_url) {
      const thumbnailPath = item.thumbnail_url.split('/images/')[1];
      if (thumbnailPath) {
        deleteImagePromises.push(R2.delete(thumbnailPath));
      }
    }

    // Delete images from R2
    await Promise.all(deleteImagePromises);

    // Delete item from database
    await DB.prepare(
      'DELETE FROM clothing_items WHERE id = ? AND user_id = ?'
    ).bind(itemId, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Item deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
