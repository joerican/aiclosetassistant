# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mobile-First Design Guidelines (Apple HIG)

This app is built mobile-first following [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines).

### Core Design Principles

**Clarity**: Design layouts that fit device screens; users shouldn't need horizontal scrolling. Use consistent alignment of text, images, and buttons to show information relationships. Position controls near the content they affect for intuitive navigation.

**Readability**: Ensure sufficient color differentiation between text and background. Prevent text overlap by adjusting line height or letter spacing appropriately.

**High Fidelity**: Provide @2x and @3x image assets to prevent blurriness on Retina displays. Display images at their intended proportions to avoid visual distortion.

### Touch Targets & Interactive Elements

- **Minimum size**: 44×44pt (44×44px in web implementation) - Apple's fundamental requirement
- **Recommended**: 48×48px for better accessibility and comfort
- **Spacing**: 8-10px minimum between interactive elements to prevent mis-taps
- **Research**: Targets smaller than 44×44pt result in 25% more mis-taps
- **Controls**: Implement UI elements specifically designed for touch gestures to ensure natural interaction

### Tailwind Implementation
```tsx
// ✅ Good - meets 44×44px minimum
<button className="p-2">              // 8px padding + content
  <Icon className="w-6 h-6" />        // 24px icon = 40×40px total (close to minimum)
</button>

// ✅ Better - exceeds minimum comfortably
<button className="p-3">              // 12px padding + content
  <Icon className="w-6 h-6" />        // 24px icon = 48×48px total
</button>

// ❌ Too small - below minimum
<button className="p-1">              // 4px padding + content
  <Icon className="w-4 h-4" />        // 16px icon = 24×24px total
</button>
```

### Responsive Sizing Pattern
```tsx
// Mobile-first with larger desktop targets
<button className="p-1.5 sm:p-2">    // 36px mobile, 40px+ desktop
  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
</button>
```

### Typography Hierarchy

**System Font**: San Francisco for Latin, Greek and Cyrillic alphabets (iOS default)

**Font Sizes**:
- **Large Titles**: 34pt (morphs to 17pt when scrolling)
- **Body Text**: 17pt minimum recommended by Apple
- **Notes/Small UI**: 13pt (smallest commonly seen in iOS)
- **Absolute Minimum**: 11pt for legibility (avoid going smaller)

**Font Weights**:
- ✅ Use: Regular, Medium, Semibold, Bold
- ❌ Avoid: Ultralight, Thin, Light (poor legibility)
- **Hierarchy**: Apply Semibold or Bold for headings, use weight and size to establish importance

**Best Practices**:
- Support Dynamic Type for accessibility
- Use system fonts when possible for consistency
- Create clear hierarchy through weight, size, and color
- Maintain minimum 11pt for iOS/iPadOS applications

### Color & Contrast

**Contrast Ratios** (WCAG Standards):
- **Text**: 4.5:1 minimum for most text elements
- **Preferred**: 7:1 for better accessibility (stringent standards)
- **Non-Text Elements**: 3:1 minimum (buttons, controls, icons)
- **Interactive States**: Ensure visible contrast between checked/unchecked, enabled/disabled states

**System Colors**:
- Prefer `UIColor` or `NSColor` system colors for text
- System colors automatically respond to accessibility settings (Invert Colors, Increase Contrast)
- Test contrast in both Light and Dark modes
- Common mistake: Forgetting to verify dark mode contrast ratios

**Testing**:
- Use Xcode's Accessibility Inspector
- Check contrast ratios with color contrast checkers
- Verify all states: default, highlighted, selected, disabled
- Test with Increase Contrast accessibility feature enabled

### Layout & Safe Areas

**Safe Areas**:
- **Top**: 44-47pt (varies by device: notch, Dynamic Island, or none)
- **Bottom**: 34pt (for devices with gesture indicators)
- **Purpose**: Avoid device interactive and display features for smooth visual experience
- **iOS 11+**: Use `safeAreaLayoutGuide` property

**Margins & Spacing**:
- **Default margin**: 16px from screen edge (AutoLayout standard)
- **Grid gaps**: `gap-2` (8px) on mobile, `gap-4` (16px) on desktop
- **Padding**: Reduce by 25-50% on mobile to maximize screen space
- **Text**: 10-12px minimum on mobile, 12-14px on desktop
- **System margins**: Each device includes layout guides for standard margins and readability

**Device Considerations**:
- iPhone X and newer: Account for notch/Dynamic Island sensors and rounded corners
- Ensure app UI doesn't get clipped by device features
- Use layout guides for consistent margins across device sizes

### Buttons & Interactive States

**Button Styles**:
- **Primary actions**: Blue (e.g., "Save")
- **Destructive actions**: Red (e.g., "Delete")
- **Visual hierarchy**: Maintain clear contrast between primary, secondary, and disabled states
- **Modern styles**: Use `.borderedProminent` and other SwiftUI button styles for traditional appearances

**Button States** (must be visually distinct):
1. **Default** - Normal resting state
2. **Highlighted** - Active touch/press state
3. **Selected** - Currently chosen option
4. **Disabled** - Non-interactive state

**Customization**:
- Buttons can include title, icon, or both
- Support custom backgrounds and styling
- Icons can be prepended or centered if no text label
- Support drop shadows, text styles, and custom colors

### Gestures & Touch Interactions

**Standard Gestures** (users expect these to work consistently):
- **Tap**: Activates a control or selects an item
- **Drag**: Moves an element from side-to-side or across the screen
- **Swipe**: Scrolls content or triggers actions
- **Flick**: Scrolls or pans quickly
- **Pinch**: Zooms in/out
- **Long Press**: Reveals contextual options

**Design Principles**:
- Offer shortcut gestures to supplement, not replace, interface-based navigation
- Always provide a simple, visible way to navigate or perform actions (even if extra taps)
- Don't rely solely on gestures - some users may not discover them
- Support multi-touch interactions when appropriate

**Categories**:
1. **Basic touchscreen**: Taps, double taps, pinches, tap-and-hold, swipes, drag-and-drop
2. **System gestures**: Control Center, Notification Panel, multitasking
3. **Text editing**: Three-finger swipes/pinches for undo, redo, copy, paste, cut

### Accessibility Requirements

- **Touch targets**: Minimum 44×44pt for all interactive elements
- **Contrast**: Meet 4.5:1 for text, 3:1 for non-text elements
- **Dynamic Type**: Support system text size preferences
- **Color independence**: Don't rely solely on color to convey information
- **System features**: Support Increase Contrast, Reduce Motion, VoiceOver
- **Testing**: Verify with Xcode Accessibility Inspector
- **App Store**: Sufficient Contrast is required for approval

### References

**Official Apple Documentation**:
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Apple Design Tips](https://developer.apple.com/design/tips/)
- [Typography Guidelines](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Color Guidelines](https://developer.apple.com/design/human-interface-guidelines/color)
- [Layout Guidelines](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Buttons Guidelines](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Accessibility & Color Contrast](https://developer.apple.com/design/human-interface-guidelines/accessibility/overview/color-and-contrast/)
- [Gestures Documentation](https://developer.apple.com/documentation/swiftui/gestures)

**Community Resources**:
- [iOS Design Guidelines (LearnUI)](https://www.learnui.design/blog/ios-design-guidelines-templates.html)
- [iOS Font Size Guidelines](https://www.learnui.design/blog/ios-font-size-guidelines.html)
- [Touch Target Accessibility](https://medium.com/@zacdicko/size-matters-accessibility-and-touch-targets-56e942adc0cc)
- [iOS Typography Best Practices](https://median.co/blog/apples-ui-dos-and-donts-typography)
- [Content Formatting Guidelines](https://median.co/blog/apples-ui-dos-and-donts-formatting-content)
- [iOS HIG Overview](https://ivomynttinen.com/blog/ios-design-guidelines/)

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
- **ALWAYS verify the build timestamp updated after deployment** - if it shows old time, deployment failed or browser cached

**If build timestamp is old after deploy:**
1. Check for authentication errors in deploy output
2. Run `wrangler login` to refresh token if needed
3. Hard refresh browser (Cmd+Shift+R) or try incognito
4. Re-run clean build: `rm -rf .next .open-next && npm run deploy`

### Two-Part Deployments (Main App + Image Processor)

**CRITICAL: When changing both the main app AND the image-processor worker, BOTH must be deployed separately:**

```bash
# 1. Deploy image-processor worker (queue consumer)
cd "/Users/jorge/Code Projects/aiclosetassistant"
npx wrangler deploy workers/image-processor/src/index.ts --name image-processor --config workers/image-processor/wrangler.toml

# 2. Deploy main app (clean build required for code changes)
cd "/Users/jorge/Code Projects/aiclosetassistant"
rm -rf .next .open-next && npm run deploy
```

**IMPORTANT:** The worker deployment MUST use explicit paths from the project root. Running `wrangler deploy` from the `workers/image-processor/` directory will incorrectly deploy the main app instead.

**Common mistake:** Only deploying the image-processor worker but not the main app (or vice versa). Changes to API routes require main app deploy. Changes to queue processing require worker deploy.

**When to deploy what:**
- API route changes (`app/api/*`) → Deploy main app
- Queue processor changes (`workers/image-processor/*`) → Deploy image-processor worker
- Both changed → Deploy BOTH (worker first, then main app)

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
- `add-status-column.sql` - Added status tracking for queue-based processing

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
- **Queues**: Cloudflare Queues for async image processing

### Workers Paid Plan Features

This project uses the **Workers Paid plan** ($5/month), which provides:

**Performance & Runtime:**
- 15 minutes CPU time per request (vs 10ms free tier)
- High performance runtime with no cold starts
- Global deployments to hundreds of data centers
- Maintenance-free infrastructure that scales automatically

**Services Available:**
- **Queues** - Async message processing for image pipeline
- **Vectorize** - Vector database for embeddings (planned: outfit recommendations)
- **Durable Objects** - Stateful serverless primitives
- **D1** - SQLite database (expanded limits)
- **KV** - Key-value storage (expanded limits)
- **R2** - Object storage (expanded limits)
- **Workers AI** - 300,000 Neurons/month included
- **Browser Rendering** - Headless browser automation
- **Containers** - Custom Docker containers

**Development:**
- Support for JavaScript and 9 additional languages
- Full CLI deployment capabilities
- Unlimited collaborators

Reference: https://developers.cloudflare.com/workers/platform/pricing/

### Image Processing Pipeline (Queue-Based)

**Architecture**: Client → Upload API → Queue → Image Processor Worker

1. **Client Upload** → Resize to 600px JPEG, compute hash, send to `/api/upload-pending`
2. **Upload API** (`/api/upload-pending`):
   - Store original in R2 `pending/{userId}/{itemId}.{ext}`
   - Create DB record with `status: 'pending'`
   - Send message to `image-processing` queue
   - Return `itemId` immediately
3. **Image Processor Worker** (queue consumer):
   - BG removal at 800px (Cloudflare Images + BiRefNet)
   - Trim transparent pixels (IMAGE_TRIM worker)
   - AI analysis (Llama 3.2 11B Vision)
   - Convert to WebP, store in R2 `items/{userId}/{itemId}.webp`
   - Update DB with metadata and `status: 'processed'` (NOT 'completed')
4. **Client Polling** → Poll `/api/item-status/[id]` until `status === 'processed'`
5. **User Confirmation** → User reviews AI metadata, clicks "Add to Closet"
6. **Save** → `/api/save-item` changes `status: 'processed'` → `status: 'completed'`
7. **Cleanup** → Hourly cron deletes 'processed' items older than 4 hours (never confirmed)

**Queue Configuration:**
- Queue name: `image-processing`
- Dead letter queue: `image-processing-dlq`
- Max batch size: 1
- Max retries: 3
- Max concurrency: 10

**Cleanup System:**
The image-processor worker includes automatic cleanup:
- **Hourly cron** (`0 * * * *`): Deletes orphaned files and unconfirmed items older than 4 hours
  - Pending files in `pending/` with no valid DB record
  - DB items with `status: 'processed'` (never confirmed by user)
  - Orphaned files in `items/` and `thumbnails/` with no DB record
- **Admin endpoints** (require `ADMIN_KEY` secret):
  - `/cleanup?key=SECRET` - Run standard cleanup (4-hour threshold)
  - `/cleanup-now?key=SECRET` - Force delete ALL non-completed items immediately
  - `/list?key=SECRET` - List all files in R2 bucket
  - `/health` - Public health check (no auth required)
- **Set admin key**: `npx wrangler secret put ADMIN_KEY --name image-processor`

### Image Processing Pipeline (Legacy Sync)

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

8. **`POST /api/upload-pending`** - Queue image for async processing
   - Input: FormData with `image`, `imageHash`, `userId`
   - Process: Store in R2 `pending/`, create DB record, send to queue
   - Output: JSON with `itemId` and `status: 'pending'`
   - Returns immediately (no blocking)

9. **`GET /api/item-status/[id]`** - Check processing status
   - Input: Item ID in URL path
   - Output: JSON with status and item data when completed
   - Status values: `pending`, `processing`, `completed`, `failed`
   - Client polls this until `completed` or `failed`

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
- `status` - Processing status: `pending`, `processing`, `completed`, `failed` (indexed)
- `error_message` - Error details when status is `failed`

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
- remeber this db issue about prouction vs local so it doesnt happen again
- always update the build number so xcode has the lastest build