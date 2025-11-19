# Next.js Route Handlers (API Routes) Reference

**Last Updated**: 2025-11-19 03:58 EST
**Version**: Next.js 16.0.3

## Overview

Route Handlers are API routes in Next.js App Router. They allow custom request handling using Web Request and Response APIs.

## File Naming Convention

- **File**: `route.ts` or `route.js`
- **Location**: Inside `app/` directory
- **Example**: `app/api/remove-background/route.ts`

## Supported HTTP Methods

Export async functions named after HTTP methods:

```typescript
export async function GET(request: Request) { }
export async function POST(request: Request) { }
export async function PUT(request: Request) { }
export async function PATCH(request: Request) { }
export async function DELETE(request: Request) { }
export async function HEAD(request: Request) { }
export async function OPTIONS(request: Request) { }
```

**Note**: If `OPTIONS` is not defined, Next.js auto-implements it.

## Function Parameters

### Request Object (NextRequest)

```typescript
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Access query params
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  // Read cookies
  const token = request.cookies.get('token');

  // Read headers
  const auth = request.headers.get('authorization');

  // Parse body
  const json = await request.json();
  const formData = await request.formData();
  const text = await request.text();
}
```

### Context Parameter (Dynamic Routes)

```typescript
// app/api/items/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // MUST await in Next.js 15+
  return Response.json({ id });
}
```

**CRITICAL**: In Next.js 15+, `params` is a **Promise** and must be awaited!

## Data Handling Patterns

### Receiving JSON
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ received: body });
}
```

### Receiving FormData
```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const name = formData.get('name') as string;

  return new Response('Success', { status: 200 });
}
```

### Returning JSON
```typescript
return Response.json({ message: 'Success' }, { status: 200 });
```

### Returning Images/Files
```typescript
const imageBuffer = await processImage();
return new Response(imageBuffer, {
  headers: {
    'Content-Type': 'image/png',
  },
});
```

## Cloudflare-Specific Patterns

### Accessing Cloudflare Bindings

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();

  // Access bindings
  const db = env.DB;          // D1 Database
  const bucket = env.R2;      // R2 Bucket
  const ai = env.AI;          // AI Workers
  const images = env.IMAGES;  // Images API

  // Use them
  const result = await db.prepare('SELECT * FROM users').all();
}
```

## Caching Behavior

**Important Change in Next.js 15+**:
- GET handlers are now **dynamic** by default (not cached)
- To enable static caching, use segment config

```typescript
// Make this route static
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  return Response.json({ data: 'cached' });
}
```

## Error Handling

```typescript
export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Process...
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

## Our Common Patterns

### Background Removal API
```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get('image') as File;

  const { env } = await getCloudflareContext();
  const result = await env.IMAGES
    .input(await image.arrayBuffer())
    .transform({ segment: 'foreground' })
    .output({ format: 'png' });

  return result.response();
}
```

### Database Query
```typescript
export async function GET(request: Request) {
  const { env } = await getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const query = category
    ? 'SELECT * FROM items WHERE category = ?'
    : 'SELECT * FROM items';

  const { results } = await env.DB
    .prepare(query)
    .bind(category)
    .all();

  return Response.json(results);
}
```

## TypeScript Types

```typescript
// For Cloudflare context
import { getCloudflareContext } from '@opennextjs/cloudflare';

// For Next.js request
import { NextRequest } from 'next/server';

// For params (dynamic routes)
type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params;
  // ...
}
```

## References

- Official Docs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Web APIs: https://developer.mozilla.org/en-US/docs/Web/API
- OpenNext Context: https://opennext.js.org/cloudflare
