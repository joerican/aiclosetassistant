import { getCloudflareContext } from '@opennextjs/cloudflare';

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

    const { env } = await getCloudflareContext();
    const AI = env.AI;
    const IMAGES = env.IMAGES;

    if (!AI) {
      return new Response(JSON.stringify({ error: 'AI binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing image with Cloudflare AI vision model, size:', image.size);

    // Convert to WebP and resize for AI analysis (WebP is much smaller)
    console.log('Converting to WebP for AI analysis...');
    const resizedResponse = await IMAGES
      .input(image.stream())
      .transform({ width: 512, fit: 'scale-down' })
      .output({ format: 'image/webp', quality: 85 });
    const resizedBlob = await resizedResponse.response().blob();
    const imageToAnalyze = new File([resizedBlob], 'analysis.webp', { type: 'image/webp' });
    console.log('Converted to WebP, size:', imageToAnalyze.size, 'bytes');

    // Convert image to base64 using chunked conversion (prevents stack overflow)
    const imageBuffer = await imageToAnalyze.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);
    const chunkSize = 8192; // Process in 8KB chunks
    let base64 = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      base64 += String.fromCharCode(...chunk);
    }

    const base64Image = btoa(base64);
    console.log('Base64 conversion complete, length:', base64Image.length);

    // First, agree to the Llama license (required before first use)
    // Try simple prompt format
    try {
      await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
        prompt: 'agree'
      });
      console.log('License agreement accepted');
    } catch (e) {
      console.log('License agreement attempt (prompt format):', e);
    }

    // Use Llama Vision to analyze the clothing item
    const prompt = `Analyze this clothing/fashion item image and provide the following information in JSON format:
{
  "category": "one of: tops, bottoms, shoes, outerwear, accessories",
  "subcategory": "specific type like t-shirt, jeans, sneakers, etc.",
  "colors": ["primary color", "secondary color if any"],
  "brand": "brand name if visible, otherwise null",
  "description": "brief description of the item",
  "tags": ["tag1", "tag2", "tag3"]
}

Only respond with valid JSON, no other text.`;

    const response = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageToAnalyze.type};base64,${base64Image}`
              }
            }
          ]
        }
      ]
    }) as any;

    console.log('AI analysis complete');

    // Extract the response text
    const analysisText = response.response || response.result?.response || '';
    console.log('AI raw response:', analysisText);

    // Try to parse JSON from the response
    let metadata;
    try {
      // If response is already an object, use it directly
      if (typeof analysisText === 'object' && analysisText !== null) {
        metadata = analysisText;
        console.log('AI response was already an object');
      } else {
        // Remove markdown code blocks if present
        const cleanText = String(analysisText).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        metadata = JSON.parse(cleanText);
      }
      console.log('AI parsed metadata:', JSON.stringify(metadata));
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', analysisText);
      // Return a default structure if parsing fails
      metadata = {
        category: 'tops',
        subcategory: null,
        colors: [],
        brand: null,
        description: typeof analysisText === 'string' ? analysisText.substring(0, 200) : JSON.stringify(analysisText),
        tags: []
      };
    }

    return Response.json({
      success: true,
      metadata
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
