# Cloudflare R2 Storage Reference

**Last Updated**: 2025-11-19 03:59 EST
**Bucket**: closet-images

## What is R2?

R2 is Cloudflare's object storage service, similar to AWS S3 but with:
- **Zero egress fees** - No charges for data transfer out
- **S3-compatible API** - Works with S3 tools
- **Global distribution** - Fast access worldwide
- **Worker integration** - Direct access from Workers

## Binding Setup

### wrangler.jsonc
```jsonc
{
  "r2_buckets": [
    {
      "binding": "CLOSET_IMAGES",
      "bucket_name": "closet-images"
    }
  ]
}
```

### TypeScript Types
```typescript
// cloudflare-env.d.ts
interface CloudflareEnv {
  CLOSET_IMAGES: R2Bucket;
}
```

## Accessing from Route Handlers

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const bucket = env.CLOSET_IMAGES;

  // Use the bucket
  await bucket.put('key', data);
}
```

## Core Methods

### put() - Upload Files

```typescript
// Upload from File
const formData = await request.formData();
const file = formData.get('image') as File;
const buffer = await file.arrayBuffer();

await env.CLOSET_IMAGES.put('images/photo.jpg', buffer, {
  httpMetadata: {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000',
  },
  customMetadata: {
    uploadedBy: userId,
    originalName: file.name,
  },
});

// Upload from string
await env.CLOSET_IMAGES.put('data/file.txt', 'Hello World', {
  httpMetadata: {
    contentType: 'text/plain',
  },
});

// Upload from Blob
const blob = new Blob([data], { type: 'image/png' });
await env.CLOSET_IMAGES.put('images/processed.png', blob);
```

**Returns**: `R2Object` with metadata about stored object

### get() - Download Files

```typescript
// Get file
const object = await env.CLOSET_IMAGES.get('images/photo.jpg');

if (!object) {
  return new Response('Not found', { status: 404 });
}

// Convert to different formats
const arrayBuffer = await object.arrayBuffer();
const text = await object.text();
const blob = await object.blob();

// Return as response
return new Response(object.body, {
  headers: {
    'Content-Type': object.httpMetadata.contentType || 'application/octet-stream',
  },
});
```

**Returns**: `R2ObjectBody` (if exists) or `null`

### head() - Check File Existence

```typescript
// Get metadata without downloading
const metadata = await env.CLOSET_IMAGES.head('images/photo.jpg');

if (!metadata) {
  console.log('File does not exist');
} else {
  console.log('Size:', metadata.size);
  console.log('Uploaded:', metadata.uploaded);
  console.log('Content-Type:', metadata.httpMetadata?.contentType);
}
```

**Returns**: `R2Object` (metadata only) or `null`

### delete() - Remove Files

```typescript
// Delete single file
await env.CLOSET_IMAGES.delete('images/old-photo.jpg');

// Delete multiple files (up to 1000)
await env.CLOSET_IMAGES.delete([
  'images/photo1.jpg',
  'images/photo2.jpg',
  'images/photo3.jpg',
]);
```

**Note**: Deletes are **strongly consistent** (immediate)

### list() - List Files

```typescript
// List all files
const list = await env.CLOSET_IMAGES.list();

list.objects.forEach(obj => {
  console.log(obj.key, obj.size);
});

// List with prefix (folder)
const images = await env.CLOSET_IMAGES.list({
  prefix: 'images/',
  limit: 100,
});

// Paginated listing
let cursor: string | undefined;
do {
  const batch = await env.CLOSET_IMAGES.list({
    prefix: 'images/',
    cursor,
  });

  batch.objects.forEach(obj => console.log(obj.key));
  cursor = batch.truncated ? batch.cursor : undefined;
} while (cursor);
```

**Returns**: Up to 1000 objects per call, lexicographically sorted

## HTTP Metadata

```typescript
await bucket.put('file.jpg', data, {
  httpMetadata: {
    contentType: 'image/jpeg',
    contentLanguage: 'en-US',
    contentDisposition: 'inline',
    contentEncoding: 'gzip',
    cacheControl: 'public, max-age=31536000',
    cacheExpiry: new Date('2026-01-01'),
  },
});
```

## Custom Metadata

```typescript
await bucket.put('file.jpg', data, {
  customMetadata: {
    userId: 'user-123',
    category: 'tops',
    uploadDate: new Date().toISOString(),
  },
});

// Retrieve custom metadata
const obj = await bucket.head('file.jpg');
console.log(obj?.customMetadata?.userId); // 'user-123'
```

## Common Patterns

### Upload Image with Unique ID
```typescript
const imageId = crypto.randomUUID();
const ext = file.name.split('.').pop() || 'jpg';
const key = `images/${imageId}.${ext}`;

await env.CLOSET_IMAGES.put(key, await file.arrayBuffer(), {
  httpMetadata: {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000',
  },
});

// Generate URL (if public)
const url = `https://closet-images.YOUR_ACCOUNT.r2.cloudflarestorage.com/${key}`;
```

### Serve Image from R2
```typescript
export async function GET(request: Request) {
  const { env } = await getCloudflareContext();
  const url = new URL(request.url);
  const key = url.pathname.slice(1); // Remove leading /

  const object = await env.CLOSET_IMAGES.get(key);

  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': object.httpEtag,
    },
  });
}
```

### Check if File Exists
```typescript
const exists = await env.CLOSET_IMAGES.head('images/photo.jpg') !== null;
```

### Get File Size
```typescript
const obj = await env.CLOSET_IMAGES.head('images/photo.jpg');
const sizeInBytes = obj?.size || 0;
const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
```

## Our Storage Structure

```
closet-images/
├── original/          # Original uploaded images
│   ├── {uuid}.jpg
│   └── {uuid}.png
├── processed/         # Background-removed images
│   └── {uuid}.png
└── thumbnails/        # Thumbnail versions
    └── {uuid}.jpg
```

## Limitations

- **Max object size**: 5 TB per object
- **Max objects**: Unlimited
- **Consistency**: Strongly consistent (reads see latest writes)
- **List limit**: 1000 objects per call
- **Delete limit**: 1000 objects per call

## Public Access

R2 buckets are private by default. To make files public:

1. **Option 1**: Use R2 custom domain
   - Configure in Cloudflare Dashboard
   - Access via: `https://yourdomain.com/path/to/file.jpg`

2. **Option 2**: Serve through Worker
   - Create Worker route to serve files
   - Add authentication/authorization logic

## Pricing

- **Storage**: $0.015 per GB/month
- **Class A Operations** (write, list): $4.50 per million
- **Class B Operations** (read): $0.36 per million
- **Egress**: **FREE** (no charges!)

## References

- Official Docs: https://developers.cloudflare.com/r2/
- Workers API: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- S3 Compatibility: https://developers.cloudflare.com/r2/api/s3/
