# AI Closet Assistant - Project Documentation

**Last Updated**: 2025-11-19
**Status**: ✅ LIVE AND WORKING
**Production URL**: https://aiclosetassistant.pages.dev

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
- **Framework**: Next.js 15 (App Router)
- **Runtime**: Cloudflare Pages Functions (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (Object Storage)
- **AI**: Cloudflare AI Workers (Background Removal)
- **Deployment**: Cloudflare Pages with GitHub integration

### Key Design Decisions

**Why Cloudflare Pages (not standalone Workers)?**
- Automatic GitHub deployment on every push
- Built-in support for Next.js via `@cloudflare/next-on-pages`
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
│   │   └── remove-background/
│   │       └── route.ts           # Background removal API (Cloudflare AI)
│   ├── closet/
│   │   ├── page.tsx               # Server component wrapper
│   │   └── ClosetClient.tsx       # Client component (category filtering)
│   ├── shuffle/
│   │   ├── page.tsx               # Server component wrapper
│   │   └── ShuffleClient.tsx      # Client component (slot machine)
│   ├── upload/
│   │   ├── page.tsx               # Server component wrapper
│   │   └── UploadClient.tsx       # Client component (camera/upload + BG removal)
│   ├── layout.tsx                 # Root layout (no auth provider)
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Tailwind styles
├── lib/
│   └── db/
│       └── schema.sql             # D1 database schema
├── types/
│   └── index.ts                   # TypeScript interfaces
├── wrangler.toml                  # Cloudflare configuration
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
- **Build Command**: `npx @cloudflare/next-on-pages@1`
- **Output Directory**: `.vercel/output/static`
- **Build Time**: ~90 seconds

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

### 2. Upload Page (`/upload`)
- **Camera capture** - Take photos directly from device camera
- **File upload** - Upload images from device storage
- **Background removal** - Uses Cloudflare AI (`@cf/cloudflare/rembg`)
- **Category selection** - Choose tops, bottoms, shoes, outerwear, accessories
- **Side-by-side preview** - Original vs. background-removed image

**API Endpoint**: `POST /api/remove-background`
- Input: FormData with `image` field
- Output: PNG image with transparent background
- Model: `@cf/cloudflare/rembg`

### 3. Closet Page (`/closet`)
- Category filtering UI
- Empty state with call-to-action
- Navigation to upload and shuffle

### 4. Shuffle Page (`/shuffle`)
- Casino-style slot machine interface
- Mock data for demonstration
- Animated shuffling effect
- Save outfit functionality (placeholder)

---

## 🚧 Features To Implement

### Next Steps (Priority Order)

#### 1. Save Items to Database
**File**: `app/upload/UploadClient.tsx` (handleUpload function)
**What to do**:
- Upload original + background-removed images to R2
- Generate unique IDs for images
- Save metadata to D1 `clothing_items` table
- Return success/failure to user

**Code Location**: Line ~109-111
```typescript
const handleUpload = async () => {
  if (!selectedFile || !category) return;
  setIsUploading(true);
  try {
    // TODO: Implement actual upload to R2 and save to D1
    // 1. Upload original image to R2: CLOSET_IMAGES/original/{id}.png
    // 2. Upload processed image to R2: CLOSET_IMAGES/processed/{id}.png
    // 3. Create thumbnails (optional)
    // 4. Save to D1 clothing_items table
  }
}
```

#### 2. Display Items in Closet
**File**: `app/closet/ClosetClient.tsx`
**What to do**:
- Fetch items from D1 based on selected category
- Display in grid layout
- Show thumbnails with category badges
- Add click to view details

#### 3. Real Shuffle with User Items
**File**: `app/shuffle/ShuffleClient.tsx`
**What to do**:
- Replace mock data with real items from D1
- Fetch user's clothing items by category
- Randomly select one from each category
- Save outfit combinations to `outfits` table

#### 4. Add Authentication
**Options**:
- **Auth.js (NextAuth)** - Better Cloudflare Pages support
- **Cloudflare Access** - Built-in Cloudflare auth
- **Custom JWT** - Roll your own with D1

**Note**: Clerk doesn't work with Cloudflare Pages edge runtime

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

### `wrangler.toml`
- **Purpose**: Cloudflare configuration for local development
- **Note**: `name = "ai-closet-assistant"` is NOT used by Pages
- **Used for**: Local development with `wrangler pages dev`

### `next.config.js`
- Disables image optimization (not supported on edge)
- Configures R2 remote patterns for images

### `middleware.ts`
- **Removed** - Was causing 500 errors with Clerk
- Not needed without authentication

### `package.json`
- Key script: `pages:build` runs `@cloudflare/next-on-pages`
- No Clerk dependencies (removed)

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
