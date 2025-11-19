# AI Closet Assistant - Project Documentation

**Last Updated**: 2025-11-19 06:37 EST (✅ Native Camera + Icons + Delete/Duplicate)
**Status**: ✅ LIVE AND WORKING - Zero Warnings, Latest Everything
**⚠️ LEGAL TODO**: Must add user license agreement before public launch (see docs/legal/llama-license-requirements.md)
**Production URL**: https://aiclosetassistant.com
**Worker URL**: https://aiclosetassistant.aiclosetassistant-com-account.workers.dev
**Project Path**: `/Users/jorge/Code Projects/aiclosetassistant`

> **📝 IMPORTANT**: Always read and update this documentation after making changes. This file is the single source of truth for the project's current state, decisions made, and ongoing work.
>
> **Note**: Documentation changes (*.md files) are ignored by Cloudflare Pages via `.cfignore` and won't trigger deployments.
>
> **Terminology**: cf = Cloudflare (Pages, Workers, D1, R2, etc.)

## 🚨 Recent Breaking Changes

**Native Camera Integration + Icon System + Delete/Duplicate Features (2025-11-19 06:37 EST)**:
- ✅ **Native Camera Picker**: Replaced WebRTC with HTML5 `capture="environment"` attribute
  - Direct camera access without permission prompts
  - Cleaner mobile experience
  - Simplified codebase (removed WebRTC code)
  - Button reordering: Take Photo first, Upload from Device second
- ✅ **Modern Icon System**: All emojis replaced with Lucide React icons
  - CoatHanger icon (@lucide/lab) for empty closet
  - Hourglass icon for loading states
  - Trousers icon (@lucide/lab) for bottoms category
  - Upload and Camera icons on upload page
  - Trash2 icon for delete functionality
  - All icons: 1.5 stroke width for elegant appearance
- ✅ **Vertical Scanning Animation**: AI processing visual feedback
  - Gold scan line with glow effect (top-to-bottom)
  - Shimmer effect on "Analyzing with AI..." text
  - CSS keyframe animations in globals.css
- ✅ **Delete Functionality**: Complete item removal system
  - DELETE endpoint: `/app/api/delete-item/route.ts`
  - Removes from D1 database and R2 storage (all 3 image variants)
  - Red trash icon button with confirmation dialog
  - Clean UX without success popup
- ✅ **Duplicate Detection**: SHA-256 image hashing to prevent duplicate uploads
  - Client-side hashing using Web Crypto API
  - Check BEFORE AI processing to save costs
  - New endpoint: `/app/api/check-duplicate/route.ts`
  - User-friendly dialog with item details when duplicate found
  - Option to proceed with duplicate if desired
  - Migration: `add-image-hash.sql` with indexed image_hash field
- **Files Updated**:
  - `/app/upload/UploadClient.tsx` - Native camera, icons, duplicate checking
  - `/app/closet/ClosetClient.tsx` - Icons, delete functionality
  - `/app/globals.css` - Vertical scanning animations
  - `/app/api/delete-item/route.ts` - NEW
  - `/app/api/check-duplicate/route.ts` - NEW
  - `/migrations/add-image-hash.sql` - NEW
  - `package.json` - Added @lucide/lab dependency
  - `.claude/rules.md` - Added cf = Cloudflare terminology

**AI Metadata Storage + Detail Modal Added (2025-11-19 04:26 EST)**:
- ✅ **AI metadata now saved to database** - subcategory, color, brand, tags stored in D1
- ✅ **Item detail modal** - Click any item in closet to see full details
- **Database Updates**:
  - Upload endpoint now saves AI-detected metadata to clothing_items table
  - Added fields: subcategory, color, brand, tags (JSON)
- **UI Improvements**:
  - Closet items now show subcategory instead of just category
  - Modal displays all AI-detected information
  - Tags displayed as purple badges
  - Shows when item was added
  - Placeholder buttons for favorite/delete features
- **Files Updated**:
  - `/app/api/upload-item/route.ts` - Parse and save AI metadata
  - `/app/upload/UploadClient.tsx` - Send AI metadata with upload
  - `/app/closet/ClosetClient.tsx` - Added detail modal on item click

**AI-Powered Metadata Extraction Added (2025-11-19 04:19 EST)**:
- ✅ **Added**: Automatic clothing analysis using Cloudflare AI vision models
- **Features**:
  - Detects category (tops, bottoms, shoes, outerwear, accessories)
  - Identifies colors (primary and secondary)
  - Recognizes brand names (if visible)
  - Generates description and tags
  - Auto-fills category field after background removal
- **Model**: Llama 3.2 11B Vision Instruct (`@cf/meta/llama-3.2-11b-vision-instruct`)
- **Cost**: ~$0.00016 per image (~0.016 cents) - extremely cheap!
- **Free Tier**: 10,000 Neurons/day (enough for 2-3 analyses/day)
- **Implementation**:
  - Created `/app/api/analyze-image/route.ts` endpoint
  - Updated `UploadClient.tsx` to call API after background removal
  - Added AI metadata display card with detected info
- **Documentation**: See `docs/api-references/cloudflare-workers-ai.md`

**Image Optimization Added (2025-11-19 04:09 EST)**:
- ✅ **Added**: Automatic image resizing and WebP compression on upload
- **Optimization Details**:
  - Original images: Max 1200px width, WebP, 85% quality
  - Processed images: Max 800px width, WebP, 90% quality
  - Thumbnails: 300px width, WebP, 80% quality
- **File Size Savings**: ~80-95% reduction (5MB photos → ~200-400KB)
- **Benefits**: Faster page loads, lower bandwidth, better mobile experience
- **Implementation**: Uses Cloudflare Images API `.transform()` + `.output()`

**Background Removal Fixed with Images API (2025-11-19 03:56 EST)**:
- ✅ **FIXED**: Background removal now works using Cloudflare Images API
- **Issue**: `@cf/cloudflare/rembg` model doesn't exist in Workers AI
- **Solution**: Use Cloudflare Images API with `segment: 'foreground'` parameter
- **Model**: BiRefNet (Bilateral Reference Network) for image segmentation
- **Changes Made**:
  - Updated `app/api/remove-background/route.ts` to use IMAGES binding
  - Added Images binding to `wrangler.jsonc`
  - Added IMAGES type to `cloudflare-env.d.ts`
- **Requirements**: Paid Cloudflare plan with Images Transformations enabled
- **Documentation**: See `docs/api-references/cloudflare-background-removal.md`

**Deploy Script Fixed (2025-11-19 03:48 EST)**:
- ✅ **Fixed**: `npm run deploy` now properly sets `NEXT_PUBLIC_BUILD_TIME`
- **Issue**: OpenNext was building without the build time environment variable
- **Solution**: Added `NEXT_PUBLIC_BUILD_TIME` to both `deploy` and `preview` scripts in package.json
- **Result**: Version badge now updates correctly on every deployment
- **Command**: `npm run deploy` (no longer need separate `npm run build`)

**Build Process Documented (2025-11-19 03:43 EST)**:
- ✅ **Version Badge**: Build timestamp now displays in bottom-right corner
- **How to Deploy**: Must run `npm run build` before deploy to update version
- **Format**: `buildYYYYMMDD-hhmmss` (e.g., `build20251119-044500`)
- **Purpose**: Verify deployments are live with visible build number
- **Documented in**: Deployment section with clear instructions

**Claude Code Configuration Added (2025-11-19 03:38 EST)**:
- ✅ **Added `.claude/rules.md`** - Automatic session initialization rules
- ✅ **Added `.claude/commands/docs.md`** - `/docs` slash command to read documentation
- **Working Directory**: Set to `/Users/jorge/Code Projects/aiclosetassistant`
- **Auto-reads**: PROJECT_DOCUMENTATION.md at start of every session
- **Benefits**: Session continuity, automatic context loading, consistent working directory

**Custom Domain Added (2025-11-19 03:35 EST)**:
- ✅ **Custom Domain**: https://aiclosetassistant.com now points to the Worker
- **Worker URL**: https://aiclosetassistant.aiclosetassistant-com-account.workers.dev (still accessible)
- **Configured in**: Cloudflare Dashboard → Workers & Pages → aiclosetassistant → Settings → Domains

**Background Removal Fixed (2025-11-19 03:30 EST)**:
- ✅ **Fixed**: Background removal now actually works using Cloudflare AI
- **Issue**: Code was using incorrect Image Transformations API instead of Cloudflare AI Workers
- **Solution**: Updated `/api/remove-background/route.ts` to use `AI.run('@cf/cloudflare/rembg')` directly
- **What Changed**:
  - Removed incorrect R2 upload/fetch logic from background removal endpoint
  - Now properly calls Cloudflare AI binding with `@cf/cloudflare/rembg` model
  - Returns actual PNG with transparent background instead of original image
- **Status**: ✅ Deployed and working

**Pages Removed - Workers-Only Deployment (2025-11-19 02:20 EST)**:
- ✅ **Cloudflare Pages project deleted** - no longer needed
- **Deployment**: Workers-only via `npx opennextjs-cloudflare deploy`
- **Production URL**: https://aiclosetassistant.aiclosetassistant-com-account.workers.dev
- **Why**: OpenNext creates `.open-next/worker.js` for Workers runtime, not static assets for Pages
- **Benefits**: No wasted build minutes, cleaner deployment, single source of truth

**Workers Deployment Discovery (2025-11-19 02:15 EST)**:
- ⚠️ **CRITICAL**: OpenNext deploys to Cloudflare **Workers**, NOT Pages
- Discovered Pages integration was incompatible with OpenNext
- Manual deployment via `npx opennextjs-cloudflare deploy` required

**Build Optimizations (2025-11-19 01:43 EST)**:
- ✅ Enabled build caching on Cloudflare Pages for faster rebuilds
- ✅ Added `.cfignore` to prevent documentation changes from triggering deployments
- **Result**: Faster builds (30-60s with cache vs 90-120s) and fewer unnecessary deployments

**Final Transitive Dependency Fix (2025-11-19 01:11 EST)**:
- Added npm overrides for `formdata-node@^6.0.3` to eliminate last deprecation warning
- **Result**: ZERO deprecation warnings in build
- Used npm overrides feature to force latest version of nested dependency

**Dependency Upgrades (2025-11-19 01:05 EST)**:
- **Next.js**: 15.5.2 → 16.0.3
- **React**: 18.3.1 → 19.2.0
- **ESLint**: 8.57.1 → 9.39.1
- **Tailwind CSS**: 3.4.18 → 4.1.17
- **Cloudflare SDK**: Updated to 5.2.0
- All TypeScript types updated to latest
- Tailwind config migrated to v4 format (removed tailwind.config.ts, updated CSS imports)

**OpenNext Migration (2025-11-19 00:48 EST)**:
- Migrated from deprecated `@cloudflare/next-on-pages` to `@opennextjs/cloudflare`
- Now using **Node.js runtime** instead of Edge runtime
- Build output changed from `.vercel/output/static` to `.open-next`
- All deprecation warnings resolved

## 📐 Development Philosophy

### Documentation First
**ALWAYS update PROJECT_DOCUMENTATION.md when making changes**. This document is the single source of truth for:
- Current state of the project
- Decisions made and why
- Breaking changes and migrations
- Next steps and priorities
- Lessons learned

Every code change, dependency update, or architectural decision MUST be documented here with timestamps. This ensures continuity between sessions and prevents knowledge loss.

**Timestamp Guidelines**:
- Use `date +"%Y-%m-%d %H:%M %Z"` command to get accurate current time
- Format: `YYYY-MM-DD HH:MM TZ` (e.g., `2025-11-19 03:43 EST`)
- Never guess timestamps - always check the actual time
- Update both the header "Last Updated" and the "Recent Breaking Changes" entry

### Always Use Latest Tools
This is a new project, so we prioritize using the latest stable versions of all tools and dependencies. When we see deprecation warnings or notices about newer versions, we migrate immediately rather than deferring upgrades. This approach:
- Prevents technical debt from accumulating
- Takes advantage of new features and performance improvements
- Avoids breaking changes becoming harder to fix later
- Keeps the codebase modern and maintainable

**Exception**: We only stick with older versions if the latest version has critical bugs or incompatibilities. Otherwise, latest = best.

**Tools for fixing transitive dependencies**: Use npm `overrides` in package.json to force updates to nested dependencies that show deprecation warnings.

---

## 📋 Project Overview

A digital wardrobe organizer that lets users:
1. Upload photos of clothing items (camera or file upload)
2. Automatically remove backgrounds using Cloudflare AI
3. Organize items by category (tops, bottoms, shoes, outerwear, accessories)
4. Use a casino-style slot machine to shuffle and discover outfit combinations

---

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 16.0.3 (App Router with Turbopack)
- **React**: React 19.2.0
- **Adapter**: OpenNext Cloudflare (@opennextjs/cloudflare v1.13.0)
- **Runtime**: Cloudflare Pages Functions (Node.js Runtime via OpenNext)
- **Styling**: Tailwind CSS 4.1.17
- **Linting**: ESLint 9.39.1
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (Object Storage)
- **AI**: Cloudflare AI Workers (Background Removal)
- **Deployment**: Cloudflare Pages with GitHub integration

### Key Design Decisions

**Why OpenNext instead of @cloudflare/next-on-pages?**
- `@cloudflare/next-on-pages` is deprecated (as of 2025)
- OpenNext is the official Cloudflare-recommended adapter for Next.js
- Supports Node.js runtime (more APIs available vs Edge runtime)
- Better Next.js 15 support and ongoing updates
- No deprecation warnings

**Why Cloudflare Workers (via OpenNext)?**
- OpenNext is designed for Cloudflare Workers runtime
- Supports full Node.js APIs (not just Edge runtime subset)
- Access to D1, R2, and AI bindings
- **Deployment**: Manual via `npx opennextjs-cloudflare deploy` or GitHub Actions
- **Note**: GitHub Pages integration exists but OpenNext outputs to Workers, not static Pages

**Why No Authentication Currently?**
- Clerk auth library incompatible with Cloudflare Pages edge runtime
- Removed to get core features working first
- Can add later with Auth.js or similar Cloudflare-compatible solution

**Why No @imgly/background-removal?**
- 27MB package exceeded Cloudflare's 25MB bundle limit
- Replaced with Cloudflare AI's built-in `@cf/cloudflare/rembg` model
- Faster, serverless, and free

---

## 🗂️ Project Structure

```
aiclosetassistant/
├── app/
│   ├── api/
│   │   ├── remove-background/
│   │   │   └── route.ts           # Background removal API (Cloudflare AI)
│   │   ├── upload-item/
│   │   │   └── route.ts           # ✅ Upload images to R2 + save to D1
│   │   └── get-items/
│   │       └── route.ts           # ✅ Fetch items from D1
│   ├── closet/
│   │   ├── page.tsx               # Server component wrapper
│   │   └── ClosetClient.tsx       # ✅ Client component (displays real items from D1)
│   ├── shuffle/
│   │   ├── page.tsx               # Server component wrapper
│   │   └── ShuffleClient.tsx      # Client component (slot machine - still mock data)
│   ├── upload/
│   │   ├── page.tsx               # Server component wrapper
│   │   └── UploadClient.tsx       # ✅ Client component (camera/upload + BG removal + R2 save)
│   ├── layout.tsx                 # Root layout (no auth provider)
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Tailwind styles
├── lib/
│   └── db/
│       └── schema.sql             # D1 database schema
├── types/
│   └── index.ts                   # TypeScript interfaces
├── wrangler.jsonc                 # ✅ Cloudflare configuration (OpenNext format)
├── open-next.config.ts            # ✅ OpenNext adapter configuration
├── .dev.vars                      # Local development environment variables
├── .cfignore                      # ✅ Files to ignore for Cloudflare deployments
├── package.json
├── next.config.js
└── tsconfig.json
```

---

## ⚙️ Cloudflare Configuration

### Current Bindings (Production & Preview)

| Binding Type | Name | Resource | Purpose |
|--------------|------|----------|---------|
| D1 Database | `DB` | `closet-db` (ID: `6b5601ee-c870-422c-8818-2d4420f1c6f3`) | Store users, clothing items, outfits, wear history |
| R2 Bucket | `CLOSET_IMAGES` | `closet-images` | Store uploaded clothing photos |
| AI Binding | `AI` | Cloudflare AI Workers | Background removal using `@cf/cloudflare/rembg` model |

### Compatibility Flags
- `nodejs_compat` - Enables Node.js APIs for edge runtime

### Environment Variables
- ~~No environment variables currently needed~~ (Clerk vars removed)
- Can be added in Cloudflare Dashboard: Settings → Environment Variables

---

## 🗄️ Database Schema

**Database**: `closet-db` (Cloudflare D1)

### Tables

#### `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT UNIQUE,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### `clothing_items`
```sql
CREATE TABLE clothing_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL, -- tops, bottoms, shoes, outerwear, accessories
  subcategory TEXT,
  color TEXT,
  brand TEXT,
  season TEXT,
  original_image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  background_removed_url TEXT,
  tags TEXT, -- JSON array
  favorite INTEGER DEFAULT 0,
  times_worn INTEGER DEFAULT 0,
  last_worn_date INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `outfits`
```sql
CREATE TABLE outfits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  item_ids TEXT NOT NULL, -- JSON array
  occasion TEXT,
  favorite INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `wear_history`
```sql
CREATE TABLE wear_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  outfit_id TEXT,
  worn_date INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES clothing_items(id) ON DELETE CASCADE,
  FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE SET NULL
);
```

**Status**: Schema applied, tables exist, ready to use (no data yet)

---

## 🚀 Deployment

### Current Deployment Strategy: Manual Workers Deployment

**Production URL**: https://aiclosetassistant.com
**Worker URL**: https://aiclosetassistant.aiclosetassistant-com-account.workers.dev

OpenNext deploys to **Cloudflare Workers** only. Cloudflare Pages project has been removed.

### How to Deploy

**Use this command to deploy:**

```bash
cd "/Users/jorge/Code Projects/aiclosetassistant"
npm run deploy
```

**What it does**:
- Sets `NEXT_PUBLIC_BUILD_TIME` with current timestamp for version badge
- Builds Next.js app with OpenNext adapter
- Uploads worker code to Cloudflare
- Binds D1, R2, and AI resources
- Makes site live at the production URL
- Version badge (bottom-right corner) shows format: `buildYYYYMMDD-hhmmss`

**Deployment Status**: ✅ Working perfectly

**Manual alternative (not recommended)**:
```bash
npm run build  # Only if you need to test build locally
npx opennextjs-cloudflare deploy
```
Note: This won't update the version badge properly. Always use `npm run deploy` instead.

### Alternative Deployment Options for Future

If you want automatic deployments on GitHub push, you can set up GitHub Actions:

#### GitHub Actions for Auto-Deploy
- Set up GitHub Actions workflow to auto-deploy on push
- Run `npx opennextjs-cloudflare deploy` in CI/CD
- Best of both worlds: auto-deploy + Workers

**To set up**: Create `.github/workflows/deploy.yml` with Cloudflare API token as secret

### Deployment Verification
```bash
# Check latest deployment
curl -s "https://api.cloudflare.com/client/v4/accounts/73d8f7df9a58eb64c1cc943d0c76d474/pages/projects/aiclosetassistant/deployments?per_page=1" \
  -H "Authorization: Bearer iGkEG8LqTuG64Ivl-QEVU44nXGmiqHZUihJRChn_" | jq '.result[0] | {status: .latest_stage.status, url: .url}'
```

---

## ✅ Current Features (Working)

### 1. Landing Page (`/`)
- Beautiful gradient design
- Feature showcase cards
- Links to Closet and Upload pages

### 2. Upload Page (`/upload`) - ✅ FULLY FUNCTIONAL
- **Camera capture** - Take photos directly from device camera
- **File upload** - Upload images from device storage
- **Background removal** - Uses Cloudflare AI (`@cf/cloudflare/rembg`)
- **Category selection** - Choose tops, bottoms, shoes, outerwear, accessories
- **Side-by-side preview** - Original vs. background-removed image
- **✅ R2 Upload** - Saves both original and processed images to R2 bucket
- **✅ Database Save** - Stores metadata in D1 `clothing_items` table

**API Endpoints**:

`POST /api/remove-background`
- Input: FormData with `image` field
- Output: PNG image with transparent background
- Model: `@cf/cloudflare/rembg`

`POST /api/upload-item`
- Input: FormData with `originalImage`, `processedImage` (optional), `category`, `userId`
- Process:
  1. Generates unique UUID for item
  2. Uploads original image to R2 at `original/{id}.{ext}`
  3. Uploads processed image to R2 at `processed/{id}.png` (if provided)
  4. Creates thumbnail at `thumbnails/{id}.jpg`
  5. Saves metadata to D1 `clothing_items` table
- Output: Success message with itemId

### 3. Closet Page (`/closet`) - ✅ FULLY FUNCTIONAL
- **✅ Real Data Display** - Fetches items from D1 database
- **Category filtering** - Filter by all, tops, bottoms, shoes, outerwear, accessories
- **Grid layout** - Responsive grid showing clothing items
- **Item cards** - Shows background-removed image, category badge, brand, color, times worn
- **Loading state** - Shows spinner while fetching
- **Empty state** - Call-to-action when no items exist
- **Error handling** - Displays errors with retry button

**API Endpoint**:

`GET /api/get-items?category={category}&userId={userId}`
- Input: Query params for category filter and user ID
- Output: JSON array of ClothingItem objects from D1
- Supports: All categories or specific category filter

### 4. Shuffle Page (`/shuffle`)
- Casino-style slot machine interface
- Mock data for demonstration (TODO: integrate with real items)
- Animated shuffling effect
- Save outfit functionality (placeholder)

---

## 🚧 Features To Implement

### Next Steps (Priority Order)

#### ~~1. Save Items to Database~~ ✅ COMPLETED
**Status**: ✅ Completed on 2025-11-19
**What was done**:
- Created `app/api/upload-item/route.ts` API endpoint
- Updated `app/upload/UploadClient.tsx` to call API
- Uploads both original and processed images to R2
- Generates unique UUIDs for each item
- Saves complete metadata to D1 `clothing_items` table
- Handles errors gracefully with user feedback

#### ~~2. Display Items in Closet~~ ✅ COMPLETED
**Status**: ✅ Completed on 2025-11-19
**What was done**:
- Created `app/api/get-items/route.ts` API endpoint
- Updated `app/closet/ClosetClient.tsx` to fetch and display real items
- Implemented category filtering with live data
- Added loading, error, and empty states
- Responsive grid layout with item cards
- Shows background-removed images, category badges, brand, color, wear count

#### 3. Real Shuffle with User Items (NEXT PRIORITY)
**File**: `app/shuffle/ShuffleClient.tsx`
**What to do**:
- Replace mock data with real items from D1
- Fetch user's clothing items by category using `/api/get-items`
- Randomly select one item from each category
- Display selected items in slot machine interface
- Add "Save Outfit" functionality to save combinations to `outfits` table
- Create new API endpoint: `POST /api/save-outfit`

**Estimated complexity**: Medium - reuse existing `/api/get-items` endpoint, add outfit save logic

#### 4. R2 Public URL Configuration
**What to do**:
- Enable R2 public access or custom domain
- Update image URLs in `app/api/upload-item/route.ts` to use proper R2 URLs
- Currently using placeholder: `https://closet-images.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/`
- Need to replace with actual R2 public bucket URL or set up Cloudflare domain

**Note**: Images are being saved to R2 but URLs need updating for public access

#### 5. Add Item Details View
**What to do**:
- Create modal or dedicated page to view item details
- Allow editing metadata (brand, color, tags, etc.)
- Add delete functionality
- Track wear history

#### 6. Add Authentication
**Options**:
- **Auth.js (NextAuth)** - Better Cloudflare Pages support
- **Cloudflare Access** - Built-in Cloudflare auth
- **Custom JWT** - Roll your own with D1

**Note**: Clerk doesn't work with Cloudflare Pages edge runtime
**Current**: Using hardcoded `userId: 'default-user'` throughout app

---

## 📝 Development Workflow

### Local Development
```bash
cd "/Users/jorge/Code Projects/aiclosetassistant"
npm run dev  # Runs on http://localhost:3000
```

**With Enhanced Logging**:
```bash
NEXT_TELEMETRY_DEBUG=1 npm run dev
```
This enables Next.js debug logging including build events, telemetry, and configuration details.

**Note**: Local dev won't have D1, R2, or AI bindings. Use `wrangler pages dev` for local testing with bindings:
```bash
npm run pages:dev
```

### Making Changes
1. Edit files locally
2. Test with `npm run dev`
3. Commit and push to deploy:
```bash
git add -A
git commit -m "Description of changes"
git push origin main
```
4. Wait ~90 seconds for deployment
5. Visit https://aiclosetassistant.pages.dev

### Checking Logs
Deployment logs available at:
- Cloudflare Dashboard: Workers & Pages → aiclosetassistant → Deployments
- Or via API (shown in Deployment Verification section above)

---

## 🔑 Credentials & Access

### Cloudflare Account
- **Email**: aiclosetassistant@alago.xyz
- **Dashboard**: https://dash.cloudflare.com
- **Account ID**: `73d8f7df9a58eb64c1cc943d0c76d474`

### GitHub Repository
- **Repo**: https://github.com/joerican/aiclosetassistant
- **Branch**: `main` (auto-deploys to production)

### Cloudflare API Token
- **Token**: `iGkEG8LqTuG64Ivl-QEVU44nXGmiqHZUihJRChn_`
- **Permissions**: Pages (Read/Edit), D1 (Edit), R2 (Edit)
- **Expires**: 2025-11-25

---

## 🐛 Known Issues & Solutions

### Issue: 500 Error on Deployment
**Cause**: Clerk authentication middleware incompatible with edge runtime
**Solution**: Removed Clerk completely (no middleware.ts file)
**Status**: ✅ Fixed

### Issue: Bundle Size Exceeded 25MB
**Cause**: @imgly/background-removal package was 27MB
**Solution**: Switched to Cloudflare AI (`@cf/cloudflare/rembg`)
**Status**: ✅ Fixed

### Issue: Environment Variables Not Applied
**Cause**: API-set env vars not picked up by GitHub deployments
**Solution**: Set env vars in Cloudflare Dashboard UI instead
**Status**: ✅ Fixed (but no env vars needed currently)

---

## 📚 Important Files Reference

### API Documentation (`docs/api-references/`)

Reference documentation for all external APIs and services we use. **These are critical** because we're using the latest versions of everything and official docs may change.

#### Core Infrastructure

- **`opennext-cloudflare.md`** - OpenNext Cloudflare Adapter
  - How we deploy Next.js to Cloudflare Workers
  - Wrangler configuration, bindings setup, deployment commands
  - Size limitations, build process, troubleshooting
  - Version: @opennextjs/cloudflare v1.13.0

- **`nextjs-route-handlers.md`** - Next.js Route Handlers (API Routes)
  - How to create API routes in App Router
  - Request/response handling, TypeScript types
  - Cloudflare context access with `getCloudflareContext()`
  - **CRITICAL**: params is a Promise in Next.js 15+ (must await!)
  - Version: Next.js 16.0.3

#### Data & Storage

- **`cloudflare-d1.md`** - Cloudflare D1 SQLite Database
  - How to query from Workers using prepare().bind().all()
  - Batch operations, transactions, type conversion
  - Our database schema reference
  - Database ID: 6b5601ee-c870-422c-8818-2d4420f1c6f3

- **`cloudflare-r2.md`** - Cloudflare R2 Object Storage
  - put(), get(), delete(), list() methods
  - Image upload patterns, metadata handling
  - Our storage structure (original/, processed/, thumbnails/)
  - Bucket: closet-images

#### AI & Image Processing

- **`cloudflare-background-removal.md`** - Cloudflare Images API
  - Documents the discovery that `@cf/cloudflare/rembg` doesn't exist
  - Shows correct way to use Images API with `segment: 'foreground'`
  - BiRefNet model usage, binding setup
  - **CRITICAL**: Read this before implementing background removal

**Why we keep these docs**:
- We upgraded to latest versions of all dependencies (Next.js 16, React 19, etc.)
- Official docs may change or become outdated
- Having local copies ensures we know exactly which APIs we're using
- Prevents future sessions from making the same mistakes
- Documents our specific implementation patterns

### `app/components/VersionBadge.tsx`
- **Purpose**: Display build version in bottom-right corner of all pages
- **Format**: `buildYYYYMMDD-hhmmss` (e.g., `build20251119-043000`)
- **How it works**:
  - Reads `NEXT_PUBLIC_BUILD_TIME` set during `npm run build`
  - Shows as small badge in bottom-right corner
  - Helps verify deployments are live
- **Location**: Imported in `app/layout.tsx`, visible on all pages

### `.claude/rules.md`
- **Purpose**: Claude Code automatic session initialization
- **What it does**:
  - Sets working directory to `/Users/jorge/Code Projects/aiclosetassistant`
  - Forces reading PROJECT_DOCUMENTATION.md at session start
  - Enforces documentation-first development philosophy
- **Benefits**: Session continuity, automatic context, consistent environment

### `.claude/commands/docs.md`
- **Purpose**: Custom slash command for reading documentation
- **Usage**: Type `/docs` to make Claude read PROJECT_DOCUMENTATION.md
- **When to use**: Mid-session context refresh or after making changes

### `wrangler.jsonc`
- **Purpose**: Cloudflare configuration for OpenNext adapter
- **Format**: JSONC (JSON with comments support)
- **Key settings**:
  - `main`: ".open-next/worker.js" (OpenNext worker entry point)
  - `compatibility_date`: "2024-12-30"
  - `compatibility_flags`: ["nodejs_compat", "global_fetch_strictly_public"]
  - Bindings for D1, R2, and AI
- **Used for**: Local preview and production deployment

### `open-next.config.ts`
- **Purpose**: OpenNext adapter configuration
- **Runtime**: Node.js runtime with edge converter
- **Settings**: Dummy cache/queue implementations (can be upgraded later)

### `.cfignore`
- **Purpose**: Tells Cloudflare Pages which files to ignore when triggering deployments
- **Why**: Documentation changes shouldn't trigger full rebuilds
- **Ignores**: All .md files, PROJECT_DOCUMENTATION.md, dev files, local env files
- **Benefit**: Faster iteration on docs without wasting build minutes

### `next.config.js`
- Disables image optimization (not supported on edge)
- Configures R2 remote patterns for images

### `middleware.ts`
- **Removed** - Was causing 500 errors with Clerk
- Not needed without authentication

### `package.json`
- **Build script**: `npm run build` - Next.js build
- **Preview script**: `npm run preview` - OpenNext build + local preview
- **Deploy script**: `npm run deploy` - OpenNext build + deploy to Cloudflare
- **Overrides section**: Forces latest versions of transitive dependencies
  - `formdata-node@^6.0.3` - Eliminates node-domexception deprecation warning
- No Clerk dependencies (removed)
- Uses `@opennextjs/cloudflare` instead of deprecated `@cloudflare/next-on-pages`

---

## 🎯 Quick Commands Reference

```bash
# Deploy to production
git push origin main

# Check deployment status
curl -s "https://api.cloudflare.com/client/v4/accounts/73d8f7df9a58eb64c1cc943d0c76d474/pages/projects/aiclosetassistant/deployments?per_page=1" \
  -H "Authorization: Bearer iGkEG8LqTuG64Ivl-QEVU44nXGmiqHZUihJRChn_" | jq '.result[0].latest_stage.status'

# Test production site
curl -s "https://aiclosetassistant.pages.dev" | grep "AI Closet Assistant"

# Local development
npm run dev

# Local development with Cloudflare bindings
npm run pages:dev
```

---

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Cloudflare D1 Docs**: https://developers.cloudflare.com/d1
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2
- **Cloudflare AI Docs**: https://developers.cloudflare.com/workers-ai

---

## 🎨 UI/UX Notes

### Color Scheme
- Primary: Purple gradient (`from-purple-600 to-pink-600`)
- Background: White → Gray gradient
- Dark mode: Supported via Tailwind dark: classes

### Layout Pattern
- All pages use max-width containers: `max-w-7xl` or `max-w-4xl`
- Consistent header with navigation
- Mobile-responsive with Tailwind breakpoints

---

**End of Documentation**

*This file should be updated whenever major changes are made to the project.*
