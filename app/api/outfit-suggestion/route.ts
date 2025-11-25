import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const { top, bottom, shoes } = await request.json();

    const { env } = await getCloudflareContext();
    const AI = env.AI;

    if (!AI) {
      return new Response(JSON.stringify({ error: 'AI not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build outfit description
    const outfitDescription = `
Top: ${top.subcategory || 'top'} in ${top.color || 'unknown color'}, ${top.style || 'casual'} style, ${top.material || 'unknown'} material
Bottom: ${bottom.subcategory || 'bottom'} in ${bottom.color || 'unknown color'}, ${bottom.style || 'casual'} style, ${bottom.material || 'unknown'} material
Shoes: ${shoes.subcategory || 'shoes'} in ${shoes.color || 'unknown color'}, ${shoes.style || 'casual'} style
    `.trim();

    // Use text generation model for quick suggestions
    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a friendly fashion stylist. Give a brief, encouraging comment (1-2 sentences) about an outfit combination. Be specific about why items work together or suggest a small tweak. Keep it casual and fun.'
        },
        {
          role: 'user',
          content: `Rate this outfit combination and give styling advice:\n\n${outfitDescription}`
        }
      ],
      max_tokens: 100,
    }) as any;

    const suggestion = response.response || "Great combination! These pieces work well together.";

    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Outfit suggestion error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get suggestion',
      suggestion: "Looking good! This outfit has potential."
    }), {
      status: 200, // Return 200 with fallback message
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
