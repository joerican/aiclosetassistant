import { getCloudflareContext } from '@opennextjs/cloudflare';
import { validateApiKey } from '@/lib/api-auth';

export async function POST(request: Request) {
  // Validate API key
  const authError = await validateApiKey(request);
  if (authError) return authError;

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

    // IMPROVED PROMPT: Stricter formatting instructions
    const prompt = `You are a fashion analysis AI. Analyze this clothing/fashion item image and provide ONLY valid JSON with no additional text before or after.

CRITICAL: Your response must be ONLY the JSON object below, with no other text, explanations, or formatting.

{
  "category": "one of: tops, bottoms, shoes, outerwear, accessories",
  "subcategory": "specific type like t-shirt, jeans, sneakers, etc.",
  "colors": ["primary color", "secondary color if any"],
  "brand": "brand name if visible, otherwise null",
  "description": "brief description of the item (plain text only, no nested JSON)",
  "tags": ["tag1", "tag2", "tag3"],
  "material": "fabric/material type (cotton, polyester, leather, denim, etc.)",
  "pattern": "pattern type (solid, striped, plaid, floral, graphic, etc.)",
  "style": "style description (casual, formal, business, athletic, vintage, etc.)",
  "fit": "fit type (slim, regular, oversized, fitted, loose, etc.)",
  "season": ["season suitability: spring, summer, fall, winter"],
  "occasion": ["suitable occasions: casual, work, formal, athletic, etc."],
  "features": ["notable features: pockets, buttons, zippers, hood, collar type, etc."],
  "condition": "apparent condition (new, good, worn, etc.)",
  "formality": "formality level (casual, smart casual, business casual, business formal, formal)",
  "color_details": {
    "primary": "primary color with details",
    "secondary": "secondary color if any",
    "accent": "accent colors if any"
  },
  "additional_observations": "any other details, characteristics, or notable aspects you can detect about this item that weren't covered above",
  "orientation": "CRITICAL: Determine if the clothing item is shown in the correct upright position. For tops/shirts: collar/neckline should be at top, hem at bottom. For pants/bottoms: waistband at top, leg openings at bottom. For shoes: sole at bottom, opening at top. Return one of: correct, upside_down, rotated_left, rotated_right, unclear"
}

IMPORTANT:
- Do NOT nest JSON objects inside string fields
- Do NOT add periods, extra text, or explanations after the JSON
- If you cannot determine a field, use null
- Respond ONLY with the JSON object
- For orientation: carefully check if the item appears upside down (e.g., shirt with collar at bottom)`;

    // Helper function to call AI (used for retry logic)
    const callAI = async () => {
      return await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
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
    };

    // Helper function to extract nested JSON from description field
    const extractNestedJSON = (text: string): any | null => {
      try {
        // Look for JSON object patterns in the text
        const jsonMatch = text.match(/\{[\s\S]*"category"[\s\S]*\}/);
        if (jsonMatch) {
          // Try to parse the extracted JSON
          const extracted = JSON.parse(jsonMatch[0]);
          console.log('Extracted nested JSON from malformed response');
          return extracted;
        }
      } catch (e) {
        console.log('Failed to extract nested JSON:', e);
      }
      return null;
    };

    // Helper function to validate parsed metadata
    const validateMetadata = (data: any): boolean => {
      // Check that essential fields exist and are the right type
      const hasCategory = typeof data.category === 'string' && data.category.length > 0;
      const hasValidColors = Array.isArray(data.colors);
      const hasDescription = typeof data.description === 'string';

      // Check that description doesn't contain nested JSON
      const descriptionHasJSON = hasDescription &&
        (data.description.includes('{') || data.description.includes('"category"'));

      const isValid = hasCategory && hasValidColors && hasDescription && !descriptionHasJSON;

      if (!isValid) {
        console.log('Validation failed:', {
          hasCategory,
          hasValidColors,
          hasDescription,
          descriptionHasJSON
        });
      }

      return isValid;
    };

    // RETRY LOGIC: Try AI call up to 2 times
    let metadata;
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`AI analysis attempt ${attempt}/${maxAttempts}`);

      const response = await callAI();
      const analysisText = response.response || response.result?.response || '';
      console.log(`AI raw response (attempt ${attempt}):`, analysisText);

      try {
        // If response is already an object, use it directly
        if (typeof analysisText === 'object' && analysisText !== null) {
          metadata = analysisText;
          console.log('AI response was already an object');
        } else {
          // Remove markdown code blocks and trailing periods if present
          let cleanText = String(analysisText)
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

          // Remove trailing period if present (AI sometimes adds this)
          if (cleanText.endsWith('.')) {
            cleanText = cleanText.slice(0, -1);
          }

          metadata = JSON.parse(cleanText);
        }

        // VALIDATION: Check if the parsed metadata is valid
        if (validateMetadata(metadata)) {
          console.log('AI metadata validated successfully');
          break; // Success! Exit retry loop
        } else {
          // NESTED JSON EXTRACTION: Try to extract nested JSON from description
          console.log('Validation failed, attempting nested JSON extraction...');
          const extracted = extractNestedJSON(JSON.stringify(metadata));

          if (extracted && validateMetadata(extracted)) {
            metadata = extracted;
            console.log('Successfully extracted and validated nested JSON');
            break; // Success! Exit retry loop
          }

          // If this was the last attempt, use what we have
          if (attempt === maxAttempts) {
            console.warn('All attempts exhausted, using best available data');
          } else {
            console.log('Retrying AI call...');
            continue; // Retry
          }
        }

      } catch (parseError) {
        console.error(`Parse error on attempt ${attempt}:`, parseError);

        // On last attempt, try nested JSON extraction as last resort
        if (attempt === maxAttempts) {
          console.log('Final attempt: trying nested JSON extraction from raw response...');
          const extracted = extractNestedJSON(String(analysisText));

          if (extracted && validateMetadata(extracted)) {
            metadata = extracted;
            console.log('Recovered data using nested JSON extraction');
            break;
          }

          // Ultimate fallback: return default structure
          console.error('All recovery attempts failed, using default structure');
          metadata = {
            category: 'tops',
            subcategory: null,
            colors: [],
            brand: null,
            description: typeof analysisText === 'string' ? analysisText.substring(0, 200) : JSON.stringify(analysisText),
            tags: [],
            material: null,
            pattern: null,
            style: null,
            fit: null,
            season: [],
            occasion: [],
            features: [],
            condition: null,
            formality: null,
            color_details: null,
            additional_observations: 'Failed to parse AI response properly'
          };
        }
      }
    }

    console.log('Final metadata:', JSON.stringify(metadata));

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
