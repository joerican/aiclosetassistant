# AI Closet Assistant - Project Documentation

**Last Updated**: 2025-11-19 00:48 EST (OpenNext migration complete)
**Status**: ✅ LIVE AND WORKING - Database Integration Complete + OpenNext Migration
**Production URL**: https://aiclosetassistant.pages.dev

## 🚨 Recent Breaking Changes

**OpenNext Migration (2025-11-19)**:
- Migrated from deprecated `@cloudflare/next-on-pages` to `@opennextjs/cloudflare`
- Now using **Node.js runtime** instead of Edge runtime
- Build output changed from `.vercel/output/static` to `.open-next/worker`
- All deprecation warnings resolved

## 📐 Development Philosophy

**Always Use Latest Tools**: This is a new project, so we prioritize using the latest stable versions of all tools and dependencies. When we see deprecation warnings or notices about newer versions, we migrate immediately rather than deferring upgrades. This approach:
- Prevents technical debt from accumulating
- Takes advantage of new features and performance improvements
- Avoids breaking changes becoming harder to fix later
- Keeps the codebase modern and maintainable

**Exception**: We only stick with older versions if the latest version has critical bugs or incompatibilities. Otherwise, latest = best.

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
- **Framework**: Next.js 15.5.2 (App Router)
- **Adapter**: OpenNext Cloudflare (@opennextjs/cloudflare v1.13.0)
- **Runtime**: Cloudflare Pages Functions (Node.js Runtime via OpenNext)
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

**Why Cloudflare Pages (not standalone Workers)?**
- Automatic GitHub deployment on every push
- Built-in support for Next.js via OpenNext adapter
- Free tier includes D1, R2, and AI access
- No separate Worker needed - Pages Functions handle everything

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

### Automatic Deployment
- **Trigger**: Every `git push` to `main` branch
- **Process**: GitHub → Cloudflare Pages → Build → Deploy
- **Build Command**: `npx opennextjs-cloudflare build` (updated 2025-11-19)
- **Output Directory**: `.open-next` (updated 2025-11-19)
- **Build Time**: ~90-120 seconds

### Manual Deployment
```bash
cd "/Users/jorge/Code Projects/aiclosetassistant"
git add -A
git commit -m "Your message"
git push origin main
```

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
