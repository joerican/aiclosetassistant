# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
cd "/Users/jorge/Code Projects/aiclosetassistant"

# Local development (no Cloudflare bindings)
npm run dev

# Local preview with Cloudflare bindings
npm run preview
```

### Deployment

**CRITICAL: Always use clean build for code changes**

```bash
cd "/Users/jorge/Code Projects/aiclosetassistant"

# Clean build and deploy (REQUIRED for code changes)
rm -rf .next .open-next && npm run deploy

# Quick deploy (only for config/doc changes with cached build)
npm run deploy
```

**Why clean build is required:**
- Next.js caches compiled code in `.next/`
- OpenNext caches worker artifacts in `.open-next/`
- Without cleaning, old code may be deployed even after changes
- Bundle size should change when packages are added/removed

**Verification:**
- Check version badge (bottom-right corner): `buildYYYYMMDD-hhmmss`
- Bundle size changes when dependencies change (e.g., 9587KB → 8810KB)

### Database Operations
```bash
# Execute SQL migration (production)
npx wrangler d1 execute closet-db --file=./migrations/migration-name.sql

# Execute SQL migration (local)
npx wrangler d1 execute closet-db --local --file=./migrations/migration-name.sql

# Query database directly
npx wrangler d1 execute closet-db --command="SELECT * FROM clothing_items LIMIT 5"
```

**Migration Files** (in `migrations/` directory):
- `add-image-hash.sql` - Added `image_hash` field with index for duplicate detection
- `add-size-field.sql` - Added size tracking for clothing items
- `add-description-notes.sql` - Added description and notes fields
- `add-purchase-details.sql` - Added purchase date and price tracking

**Migration Pattern**: Create .sql file → Test locally → Apply to production → Commit to git

### Monitoring
```bash
# View live production logs
cd "/Users/jorge/Code Projects/aiclosetassistant" && wrangler tail --format=pretty
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router) deployed to Cloudflare Workers via OpenNext
- **Runtime**: Node.js (not Edge) on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (Object Storage)
- **AI**: Cloudflare Workers AI (Llama 3.2 11B Vision, BiRefNet background removal)
- **Image Processing**: Cloudflare Images API

### Image Processing Pipeline

**Server-side only** (no client-side processing to avoid OOM errors on mobile):

1. **Upload** → Original image sent to server
2. **Background Removal** (`/api/remove-background`):
   - Resize to 600px (Cloudflare Images API)
   - Remove background with `segment: 'foreground'` (BiRefNet model)
   - Return PNG with transparency
3. **AI Analysis** (`/api/analyze-image`):
   - Detect category, subcategory, colors, brand
   - Uses Llama 3.2 11B Vision Instruct model
4. **Final Upload** (`/api/upload-item`):
   - Resize original to 800px WebP (for display)
   - Create 200px WebP thumbnail
   - Upload all 3 versions to R2: `original/`, `processed/`, `thumbnails/`
   - Save metadata to D1

**Key constraint**: All image processing MUST be server-side. Client-side libraries like `@imgly/background-removal` cause out-of-memory errors on mobile devices.

### Cloudflare Images API Output Format

**CRITICAL**: Use format strings WITH `image/` prefix:

```typescript
// ✅ CORRECT - Always use 'image/' prefix
.output({ format: 'image/png' })
.output({ format: 'image/webp', quality: 85 })

// ❌ WRONG - causes "invalid output format" error
.output({ format: 'png' })
.output({ format: 'webp', quality: 85 })
```

**Error message if wrong:** `IMAGES_TRANSFORM_ERROR 9432: Bad request: invalid output format`

**Getting the result:**
```typescript
// ✅ CORRECT - Must call .response() first
const result = await IMAGES.input(...).transform(...).output({ format: 'image/webp' });
const response = await result.response();
const arrayBuffer = await response.arrayBuffer();

// ❌ WRONG - .arrayBuffer() is not a function on the transform result
const result = await IMAGES.input(...).transform(...).output({ format: 'image/webp' });
const arrayBuffer = await result.arrayBuffer(); // TypeError!
```

### Server-Side ArrayBuffer Pattern

**CRITICAL**: When using Cloudflare Images API multiple times on the same file, convert to ArrayBuffer first to avoid stream consumption errors:

```typescript
// ✅ CORRECT - reusable ArrayBuffer
const arrayBuffer = await file.arrayBuffer();
const image1 = await IMAGES.input(arrayBuffer).transform({...}).output({...});
const image2 = await IMAGES.input(arrayBuffer).transform({...}).output({...});

// ❌ WRONG - stream can only be consumed once
const stream = file.stream();
const image1 = await IMAGES.input(stream).transform({...}); // Works
const image2 = await IMAGES.input(stream).transform({...}); // ERROR: stream already consumed
```

### Cloudflare Bindings Access

Use `getCloudflareContext()` to access bindings in API routes:

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const DB = env.DB;           // D1 Database
  const R2 = env.CLOSET_IMAGES; // R2 Bucket
  const AI = env.AI;           // Workers AI
  const IMAGES = env.IMAGES;   // Images API
}
```

### API Routes Structure

All API routes in `app/api/*/route.ts` follow Next.js App Router conventions:

- Use `export async function POST(request: Request)` for endpoints
- Access bindings via `getCloudflareContext()`
- Return `Response` objects with JSON
- Handle errors with try/catch and return 500 status

**CRITICAL - Next.js 16+ Breaking Change:**
```typescript
// ❌ WRONG - Next.js 15 and earlier
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const itemId = params.id;  // Sync access
}

// ✅ CORRECT - Next.js 16+
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;  // Must await!
  const itemId = resolvedParams.id;
}
```

Route params are now Promises and MUST be awaited. Dynamic routes like `[id]` or `[...path]` require this pattern.

**Available API Endpoints:**

1. **`POST /api/remove-background`** - Remove image background
   - Input: FormData with `image` field
   - Output: PNG with transparent background
   - Uses: Cloudflare Images API with `segment: 'foreground'` (BiRefNet)
   - Size: Resizes to 600px width

2. **`POST /api/analyze-image`** - AI-powered metadata extraction
   - Input: FormData with `image` field
   - Output: JSON with category, subcategory, colors, brand, description, tags
   - Uses: Llama 3.2 11B Vision Instruct model
   - Note: Converts to WebP (512px) to reduce size before analysis
   - Note: Uses chunked base64 conversion to avoid stack overflow

3. **`POST /api/check-duplicate`** - Check if image already exists
   - Input: JSON with `imageHash` (SHA-256)
   - Output: JSON with `isDuplicate` and item details if found
   - Uses: D1 database query on indexed `image_hash` field
   - Called BEFORE AI processing to save costs

4. **`POST /api/upload-item`** - Save item to closet
   - Input: FormData with images and metadata
   - Process: Creates 3 image variants (original 800px, processed 600px, thumbnail 200px)
   - Storage: Uploads to R2 (`original/`, `processed/`, `thumbnails/`)
   - Database: Saves metadata to D1 `clothing_items` table
   - Duplicate Detection: Computes and stores SHA-256 hash

5. **`GET /api/get-items`** - Fetch closet items
   - Input: Query params `userId`, `category` (optional)
   - Output: JSON array of clothing items from D1
   - Supports category filtering

6. **`DELETE /api/delete-item`** - Remove item from closet
   - Input: JSON with `itemId`, `userId`
   - Process: Deletes from D1 and removes all 3 R2 images
   - Returns: Success confirmation

7. **`GET /api/images/[...path]`** - Serve images from R2
   - Input: Dynamic path segments (e.g., `/api/images/original/abc123.jpg`)
   - Output: Image file with proper content-type headers
   - Cache: 1 year immutable cache headers for performance
   - Purpose: R2 buckets are private by default; this proxies requests through the Worker
   - Note: Params must be awaited in Next.js 16+ (`const resolvedParams = await params`)

### Client/Server Component Split

**Pattern**: Server component wrapper + Client component for interactivity

```
app/upload/
├── page.tsx          # Server component (wrapper)
└── UploadClient.tsx  # Client component ('use client')
```

Server components handle data fetching, Client components handle UI state and interactions.

## Critical Implementation Details

### Image Optimization Sizes
- **Original**: 800px width, WebP, 85% quality
- **Processed** (background removed): 600px width, PNG (for transparency)
- **Thumbnails**: 200px width, WebP, 80% quality

These sizes are optimized for mobile-first design (max 4"×4" display) and prevent OOM errors.

### Database Schema

**Key Tables:**
- `clothing_items` - Store uploaded items with AI-detected metadata
- `outfits` - Save outfit combinations (future)
- `wear_history` - Track when items are worn (future)

**Important Fields:**
- `image_hash` - SHA-256 hash for duplicate detection (indexed)
- `tags` - JSON array of AI-detected tags
- `background_removed_url` - Processed image with transparent background

### Duplicate Detection System

**How it works:**
1. Client computes SHA-256 hash of uploaded image using Web Crypto API
2. Before AI processing, calls `POST /api/check-duplicate` with hash
3. Server queries D1 for existing item with same hash (indexed for speed)
4. If duplicate found, shows user-friendly dialog with item details
5. User can choose to cancel or proceed with duplicate upload
6. Hash stored in database on successful upload for future checks

**Why check before AI processing?**
- Llama Vision costs $0.00016 per image (~2-3 analyses/day on free tier)
- Saves API calls and stays within free tier limits
- Provides instant feedback without waiting for AI

**Implementation:**
- Client: `app/upload/UploadClient.tsx` (SHA-256 hashing)
- API: `app/api/check-duplicate/route.ts` (hash lookup)
- Database: `image_hash` field with index on `clothing_items` table

### R2 Storage Structure

**Bucket**: `closet-images`

**Directory Layout:**
```
closet-images/
├── original/          # Full-size uploaded images (800px WebP, 85% quality)
│   └── {uuid}.webp
├── processed/         # Background-removed images (600px PNG for transparency)
│   └── {uuid}.png
└── thumbnails/        # Small previews (200px WebP, 80% quality)
    └── {uuid}.webp
```

**Access Pattern:**
- R2 bucket is **private** (no public URLs)
- All images served through `/api/images/[...path]` proxy route
- URLs format: `/api/images/original/{uuid}.webp`
- Benefits: Access control, analytics, caching headers

**Image URLs in Database:**
```typescript
const item = {
  original_image_url: `/api/images/original/${uuid}.webp`,
  background_removed_url: `/api/images/processed/${uuid}.png`,
  thumbnail_url: `/api/images/thumbnails/${uuid}.webp`
}
```

### CPU Time Limits

Cloudflare Workers have CPU time limits. To avoid exceeding them:
- Process images sequentially, not in parallel
- Use ArrayBuffer instead of streams to avoid re-processing
- Keep image transforms simple (one resize + one format conversion)
- Avoid multiple transform chains when possible

## Documentation Requirements

**ALWAYS update PROJECT_DOCUMENTATION.md after making changes:**

1. Get accurate timestamp: `date +"%Y-%m-%d %H:%M %Z"`
2. Update header "Last Updated" field
3. Add entry to "Recent Breaking Changes" section
4. Document what changed, why, and any new issues
5. Never guess timestamps - always check actual time

The PROJECT_DOCUMENTATION.md file is the single source of truth for project state.

## Known Limitations

### No Auto-Trim for Transparent Images
Cloudflare Images API does not support automatic trimming of transparent pixels. The `trim` parameter only accepts fixed pixel values, not auto-detection of content bounds.

**Workaround**: Accept images with some transparent padding, or implement client-side cropping (with caution due to mobile OOM issues).

### Authentication Temporarily Disabled
- Clerk auth removed due to Cloudflare edge runtime incompatibility
- All users currently use `userId: 'default-user'`
- Future: Implement Auth.js or Cloudflare Access

### Cloudflare-Specific Limitations
- Worker bundle size: 25MB limit (currently ~8.8MB)
- CPU time limits (careful with image processing)
- D1 database: SQLite syntax, integer primary keys become strings
- R2: No automatic public URLs (using `/api/images/` proxy route)
- always commit and push after making change so we can have good version control to rollback changes