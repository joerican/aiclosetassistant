import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const { locked, currentOutfit, previousOutfit } = await request.json();

    const { env } = await getCloudflareContext();
    const DB = env.DB;
    const AI = env.AI;

    if (!DB || !AI) {
      return new Response(JSON.stringify({ error: 'Bindings not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all items grouped by category
    const allItems = await DB.prepare(
      'SELECT * FROM clothing_items WHERE user_id = ? AND status = ?'
    ).bind(userId, 'completed').all();

    const items = {
      tops: allItems.results.filter((item: any) => item.category === 'tops'),
      bottoms: allItems.results.filter((item: any) => item.category === 'bottoms'),
      shoes: allItems.results.filter((item: any) => item.category === 'shoes'),
    };

    if (items.tops.length === 0 || items.bottoms.length === 0 || items.shoes.length === 0) {
      return new Response(JSON.stringify({ error: 'Not enough items' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch disliked outfit combinations to avoid
    const disliked = await DB.prepare(
      'SELECT top_id, bottom_id, shoes_id FROM disliked_outfits WHERE user_id = ?'
    ).bind(userId).all();

    const dislikedCombos = new Set(
      disliked.results.map((d: any) => `${d.top_id}-${d.bottom_id}-${d.shoes_id}`)
    );

    // Build item descriptions for AI
    const formatItem = (item: any) => ({
      id: item.id,
      subcategory: item.subcategory || 'unknown',
      color: item.color || 'unknown',
      style: item.style || 'casual',
      material: item.material || 'unknown',
    });

    // Determine which items are locked
    const lockedTop = locked?.top && currentOutfit?.top ? formatItem(currentOutfit.top) : null;
    const lockedBottom = locked?.bottom && currentOutfit?.bottom ? formatItem(currentOutfit.bottom) : null;
    const lockedShoes = locked?.shoes && currentOutfit?.shoes ? formatItem(currentOutfit.shoes) : null;

    // Build the prompt
    let prompt = `You are a fashion stylist. Pick items that create a cohesive outfit.

Available items:
`;

    if (!lockedTop) {
      prompt += `\nTOPS:\n${items.tops.map((t: any) => `- ID: ${t.id} | ${t.subcategory || 'top'} | ${t.color || 'unknown'} | ${t.style || 'casual'} | ${t.material || 'unknown'}`).join('\n')}`;
    } else {
      prompt += `\nLOCKED TOP: ${lockedTop.subcategory} | ${lockedTop.color} | ${lockedTop.style}`;
    }

    if (!lockedBottom) {
      prompt += `\n\nBOTTOMS:\n${items.bottoms.map((b: any) => `- ID: ${b.id} | ${b.subcategory || 'bottom'} | ${b.color || 'unknown'} | ${b.style || 'casual'} | ${b.material || 'unknown'}`).join('\n')}`;
    } else {
      prompt += `\n\nLOCKED BOTTOM: ${lockedBottom.subcategory} | ${lockedBottom.color} | ${lockedBottom.style}`;
    }

    if (!lockedShoes) {
      prompt += `\n\nSHOES:\n${items.shoes.map((s: any) => `- ID: ${s.id} | ${s.subcategory || 'shoes'} | ${s.color || 'unknown'} | ${s.style || 'casual'}`).join('\n')}`;
    } else {
      prompt += `\n\nLOCKED SHOES: ${lockedShoes.subcategory} | ${lockedShoes.color} | ${lockedShoes.style}`;
    }

    // Add disliked combinations to avoid
    if (dislikedCombos.size > 0) {
      prompt += `\n\nAVOID these previously disliked combinations (top-bottom-shoes IDs): ${Array.from(dislikedCombos).slice(0, 10).join(', ')}`;
    }

    // Add previous outfit to avoid repeating same items
    if (previousOutfit) {
      const avoidItems = [];
      if (previousOutfit.top && !locked?.top) avoidItems.push(`top ID ${previousOutfit.top.id}`);
      if (previousOutfit.bottom && !locked?.bottom) avoidItems.push(`bottom ID ${previousOutfit.bottom.id}`);
      if (previousOutfit.shoes && !locked?.shoes) avoidItems.push(`shoes ID ${previousOutfit.shoes.id}`);
      if (avoidItems.length > 0) {
        prompt += `\n\nTry to pick DIFFERENT items than last time. Avoid: ${avoidItems.join(', ')}`;
      }
    }

    prompt += `

Pick items that work well together based on:
- Color harmony (complementary or matching colors)
- Style consistency (casual with casual, formal with formal)
- Season appropriateness

Return JSON only:
{
  ${!lockedTop ? '"top_id": "the-id-you-chose",' : ''}
  ${!lockedBottom ? '"bottom_id": "the-id-you-chose",' : ''}
  ${!lockedShoes ? '"shoes_id": "the-id-you-chose",' : ''}
  "reason": "Brief 1-sentence explanation of why these items work together"
}`;

    // Call AI
    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
    }) as any;

    let aiResult = null;
    const responseText = response.response;
    console.log('[generate-outfit] AI response:', responseText);

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        aiResult = JSON.parse(jsonMatch[0]);
        console.log('[generate-outfit] Parsed result:', JSON.stringify(aiResult));
      } catch (e) {
        console.error('[generate-outfit] Failed to parse AI response:', e);
      }
    } else {
      console.log('[generate-outfit] No JSON found in response');
    }

    // Get selected items
    let selectedTop = lockedTop ? items.tops.find((t: any) => t.id === currentOutfit.top.id) : null;
    let selectedBottom = lockedBottom ? items.bottoms.find((b: any) => b.id === currentOutfit.bottom.id) : null;
    let selectedShoes = lockedShoes ? items.shoes.find((s: any) => s.id === currentOutfit.shoes.id) : null;

    if (aiResult) {
      if (!lockedTop && aiResult.top_id) {
        selectedTop = items.tops.find((t: any) => t.id === aiResult.top_id);
      }
      if (!lockedBottom && aiResult.bottom_id) {
        selectedBottom = items.bottoms.find((b: any) => b.id === aiResult.bottom_id);
      }
      if (!lockedShoes && aiResult.shoes_id) {
        selectedShoes = items.shoes.find((s: any) => s.id === aiResult.shoes_id);
      }
    }

    // Fallback to random if AI didn't return valid IDs
    if (!selectedTop) {
      selectedTop = items.tops[Math.floor(Math.random() * items.tops.length)];
    }
    if (!selectedBottom) {
      selectedBottom = items.bottoms[Math.floor(Math.random() * items.bottoms.length)];
    }
    if (!selectedShoes) {
      selectedShoes = items.shoes[Math.floor(Math.random() * items.shoes.length)];
    }

    // Check if this combination is disliked and try to find alternative
    const comboKey = `${selectedTop.id}-${selectedBottom.id}-${selectedShoes.id}`;
    if (dislikedCombos.has(comboKey)) {
      // Try a few random alternatives
      for (let i = 0; i < 10; i++) {
        const altTop = lockedTop ? selectedTop : items.tops[Math.floor(Math.random() * items.tops.length)];
        const altBottom = lockedBottom ? selectedBottom : items.bottoms[Math.floor(Math.random() * items.bottoms.length)];
        const altShoes = lockedShoes ? selectedShoes : items.shoes[Math.floor(Math.random() * items.shoes.length)];
        const altKey = `${altTop.id}-${altBottom.id}-${altShoes.id}`;
        if (!dislikedCombos.has(altKey)) {
          selectedTop = altTop;
          selectedBottom = altBottom;
          selectedShoes = altShoes;
          break;
        }
      }
    }

    return new Response(JSON.stringify({
      top: selectedTop,
      bottom: selectedBottom,
      shoes: selectedShoes,
      suggestion: aiResult?.reason || 'Great combination!',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate outfit error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate outfit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
