# Cloudflare Workers AI Reference

**Last Updated**: 2025-11-19 04:19 EST

## What is Workers AI?

Workers AI is Cloudflare's serverless AI inference platform that runs AI models directly in Cloudflare Workers:
- **No GPU management** - Cloudflare handles infrastructure
- **Global edge deployment** - Low latency worldwide
- **Simple API** - Just call `AI.run(model, input)`
- **Pay per use** - Only pay for what you use
- **Free tier** - 10,000 Neurons/day included

## Binding Setup

### wrangler.jsonc
```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

### TypeScript Types
```typescript
// cloudflare-env.d.ts
interface CloudflareEnv {
  AI: Ai;
}
```

## Accessing from Route Handlers

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const AI = env.AI;

  const response = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
    messages: [/* ... */]
  });

  return Response.json(response);
}
```

## Vision Models

### Llama 3.2 11B Vision Instruct

**Model ID**: `@cf/meta/llama-3.2-11b-vision-instruct`

**Use Cases**:
- Image understanding and description
- Visual question answering
- Object detection and classification
- Clothing/fashion analysis
- Brand/logo recognition

**Input Format**:
```typescript
const response = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is in this image?'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }
  ]
}) as any;
```

**Converting Image to Base64**:
```typescript
const formData = await request.formData();
const image = formData.get('image') as File;

const imageBuffer = await image.arrayBuffer();
const base64Image = btoa(
  String.fromCharCode(...new Uint8Array(imageBuffer))
);
```

**Output Format**:
```typescript
{
  response: "string containing the model's response",
  // or sometimes:
  result: {
    response: "string containing the model's response"
  }
}
```

### UForm-Gen2 QwQ (Alternative Vision Model)

**Model ID**: `@cf/unum/uform-gen2-qwen-500m`

**Use Cases**:
- Faster, lighter vision model
- Image captioning
- Visual understanding

**Pricing**: Cheaper than Llama Vision (fewer neurons)

## Pricing

**Free Tier**:
- 10,000 Neurons/day
- Resets at 00:00 UTC
- Enough for ~2-3 Llama Vision requests/day

**Paid Plan** (Workers Paid):
- $0.011 per 1,000 Neurons

**Llama 3.2 11B Vision Costs**:
- Input: $0.049 per 1M tokens (4,410 neurons per 1M tokens)
- Output: $0.676 per 1M tokens (61,493 neurons per 1M tokens)

**Cost per Image Analysis** (estimated):
- ~500 input tokens (image + prompt) = $0.000025
- ~200 output tokens (JSON response) = $0.000135
- **Total: ~$0.00016 per image** (0.016 cents)

**Real-World Examples**:
- 100 images/month = ~$0.016 (1.6 cents)
- 1,000 images/month = ~$0.16 (16 cents)
- 10,000 images/month = ~$1.60

## Common Patterns

### Analyze Clothing Image

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get('image') as File;

  const { env } = await getCloudflareContext();
  const AI = env.AI;

  // Convert to base64
  const imageBuffer = await image.arrayBuffer();
  const base64Image = btoa(
    String.fromCharCode(...new Uint8Array(imageBuffer))
  );

  // Prompt for structured JSON output
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
              url: `data:${image.type};base64,${base64Image}`
            }
          }
        ]
      }
    ]
  }) as any;

  // Extract response text
  const analysisText = response.response || response.result?.response || '';

  // Parse JSON (handle markdown code blocks)
  let metadata;
  try {
    const cleanText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    metadata = JSON.parse(cleanText);
  } catch (parseError) {
    console.error('Failed to parse AI response:', analysisText);
    // Fallback structure
    metadata = {
      category: 'unknown',
      subcategory: null,
      colors: [],
      brand: null,
      description: analysisText.substring(0, 200),
      tags: []
    };
  }

  return Response.json({ success: true, metadata });
}
```

### Visual Question Answering

```typescript
const response = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Is this person wearing a hat?'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }
  ]
});

const answer = response.response; // "Yes, the person is wearing a red baseball cap."
```

## Other Available Models

### Text Generation
- `@cf/meta/llama-4-scout` - Latest Llama 4 model
- `@cf/meta/llama-3.1-8b-instruct` - Fast, efficient
- `@cf/meta/llama-3.3-70b-instruct-fp8-fast` - Most capable

### Text Embedding
- `@cf/baai/bge-base-en-v1.5` - Convert text to vectors

### Image Generation
- `@cf/black-forest-labs/flux-1-schnell` - Fast image generation
- `@cf/stabilityai/stable-diffusion-xl-base-1.0` - High quality

### Translation
- `@cf/meta/m2m100-1.2b` - Multilingual translation

## Limitations

- **Timeout**: 30 seconds for Workers, 15 minutes for Queues
- **Concurrency**: Limited concurrent requests (automatic rate limiting)
- **Image Size**: Recommended max 2MB for vision models
- **Context Length**: Varies by model (Llama Vision: 128K tokens)

## Error Handling

```typescript
try {
  const response = await AI.run(model, input);
  return Response.json(response);
} catch (error) {
  console.error('AI error:', error);

  if (error instanceof Error && error.message.includes('timeout')) {
    return Response.json({ error: 'AI request timed out' }, { status: 504 });
  }

  if (error instanceof Error && error.message.includes('rate limit')) {
    return Response.json({ error: 'Too many requests, try again later' }, { status: 429 });
  }

  return Response.json({ error: 'AI processing failed' }, { status: 500 });
}
```

## Best Practices

1. **Use Structured Prompts** - Ask for JSON output for easier parsing
2. **Handle Non-JSON Responses** - AI may wrap JSON in markdown code blocks
3. **Optimize Image Size** - Resize images before sending (max 1200px)
4. **Cache Results** - Store AI responses in D1 to avoid re-processing
5. **Batch Processing** - Use Queues for bulk image analysis
6. **Monitor Costs** - Track neuron usage in Cloudflare dashboard

## References

- Official Docs: https://developers.cloudflare.com/workers-ai/
- Pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Llama Vision Tutorial: https://developers.cloudflare.com/workers-ai/guides/tutorials/llama-vision-tutorial/
- Model Catalog: https://developers.cloudflare.com/workers-ai/models/
- Playground: https://playground.ai.cloudflare.com/
