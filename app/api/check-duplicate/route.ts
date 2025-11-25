import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const { imageHash } = await request.json();

    if (!imageHash) {
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

    // Hamming distance function for perceptual hash comparison
    function hammingDistance(hash1: string, hash2: string): number {
      if (hash1.length !== hash2.length) return 64; // Max distance
      let distance = 0;
      // Convert hex to binary and compare bits
      const bin1 = BigInt('0x' + hash1);
      const bin2 = BigInt('0x' + hash2);
      let xor = bin1 ^ bin2;
      while (xor > BigInt(0)) {
        distance += Number(xor & BigInt(1));
        xor >>= BigInt(1);
      }
      return distance;
    }

    // Only check against COMPLETED (saved) items
    // Processed items are still pending user confirmation and shouldn't trigger duplicates
    const allItems = await DB.prepare(
      'SELECT id, subcategory, color, brand, image_hash FROM clothing_items WHERE user_id = ? AND image_hash IS NOT NULL AND status = ?'
    ).bind(userId, 'completed').all();

    console.log('[check-duplicate] Found', allItems.results?.length || 0, 'items with hashes for user', userId);
    console.log('[check-duplicate] Checking hash:', imageHash);

    // Find closest match within threshold (≤10 bits difference for 64-bit hash)
    // More aggressive threshold to catch similar uploads
    const HAMMING_THRESHOLD = 10;
    let closestMatch = null;
    let closestDistance = Infinity;

    for (const item of allItems.results || []) {
      const itemHash = item.image_hash as string;
      if (itemHash) {
        const distance = hammingDistance(imageHash, itemHash);
        if (distance <= HAMMING_THRESHOLD && distance < closestDistance) {
          closestDistance = distance;
          closestMatch = item;
        }
      }
    }

    if (closestMatch) {
      console.log('[check-duplicate] DUPLICATE FOUND - distance:', closestDistance, 'item:', closestMatch.id);
      return new Response(
        JSON.stringify({
          duplicate: true,
          existingItem: {
            id: closestMatch.id,
            subcategory: closestMatch.subcategory,
            color: closestMatch.color,
            brand: closestMatch.brand,
          },
          hammingDistance: closestDistance,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[check-duplicate] No duplicate found');
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
