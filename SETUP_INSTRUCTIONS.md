# AI Closet Assistant - Setup Instructions

## Project Status

✅ **GitHub Repository**: https://github.com/joerican/aiclosetassistant
✅ **All core features implemented**
✅ **Ready for deployment**

## What's Been Built

### Core Features
1. **Landing Page** - Marketing page with feature highlights
2. **Authentication** - Clerk-powered sign-in/sign-up
3. **Closet Dashboard** - Main wardrobe management interface
4. **Upload System** - Camera + file upload with background removal
5. **Outfit Shuffle** - Casino-style slot machine for outfit discovery

### Technical Stack
- Next.js 15 with App Router
- TypeScript + Tailwind CSS
- Clerk Authentication
- @imgly/background-removal (client-side)
- Configured for Cloudflare Pages

## Next Steps to Complete Deployment

### 1. Set Up Clerk (5 minutes)

Go to https://clerk.com and create an account:

1. Create a new application called "AI Closet Assistant"
2. Get your API keys from the dashboard
3. Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/closet
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/closet
```

4. Test locally by running:
```bash
npm run dev
```

Visit http://localhost:3000 and test the authentication flow.

### 2. Set Up Cloudflare D1 Database (5 minutes)

```bash
# Login to Cloudflare (will open browser)
npx wrangler login

# Create the database
npx wrangler d1 create closet-db

# You'll see output like:
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Copy this ID and update wrangler.toml
# Uncomment the [[d1_databases]] section and add your database_id

# Run the schema to create tables
npx wrangler d1 execute closet-db --file=./lib/db/schema.sql
```

### 3. Set Up Cloudflare R2 Bucket (2 minutes)

```bash
# Create the bucket
npx wrangler r2 bucket create closet-images

# Update wrangler.toml
# Uncomment the [[r2_buckets]] section
```

### 4. Connect GitHub to Cloudflare Pages (10 minutes)

1. Go to https://dash.cloudflare.com
2. Sign in with: **aiclosetassistant@alago.xyz**
3. Navigate to: **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
4. Authorize GitHub and select: **joerican/aiclosetassistant**
5. Configure build settings:
   - Framework preset: **Next.js**
   - Build command: **`npm run pages:build`**
   - Build output directory: **`.vercel/output/static`**
   - Node version: **18**

6. Click **Save and Deploy**

### 5. Add Environment Variables to Cloudflare Pages

In the Cloudflare Pages dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables (both Production and Preview):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
CLERK_SECRET_KEY = sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /closet
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /closet
```

### 6. Bind D1 and R2 to Cloudflare Pages

In the Cloudflare Pages project settings:

1. Go to **Settings** → **Functions**
2. Under **D1 database bindings**:
   - Variable name: **`DB`**
   - D1 database: Select **closet-db**
3. Under **R2 bucket bindings**:
   - Variable name: **`CLOSET_IMAGES`**
   - R2 bucket: Select **closet-images**
4. Click **Save**

### 7. Update Clerk Allowed Domains

Back in Clerk Dashboard:

1. Go to **Domains**
2. Add your Cloudflare Pages URL: `https://your-project.pages.dev`
3. If using custom domain, add: `https://aiclosetassistant.com`

### 8. Trigger Deployment

The site should auto-deploy after connecting GitHub. To manually trigger:

```bash
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

Or use Wrangler:

```bash
npm run pages:deploy
```

## Testing Your Deployment

1. Visit your Cloudflare Pages URL (shown in dashboard)
2. Test the sign-up flow
3. Try uploading an image (camera or file)
4. Test background removal (may take 10-15 seconds)
5. Try the outfit shuffle feature

## Setting Up Custom Domain (Optional)

1. In Cloudflare Pages, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: **aiclosetassistant.com**
4. Follow the DNS instructions
5. Wait 5-10 minutes for propagation

## Current Limitations (To Be Built)

The following features show placeholder/mock data and need API implementation:

1. **Closet Items** - Items aren't actually saved to D1 yet (upload is simulated)
2. **Item Display** - Closet shows empty state (need to fetch from D1)
3. **Outfit Saving** - Shuffle uses mock data and save is placeholder
4. **R2 Storage** - Images aren't uploaded to R2 yet (need API route)

These can be implemented in Phase 2 by adding:
- API routes in `app/api/items/route.ts`
- API routes in `app/api/upload/route.ts`
- API routes in `app/api/outfits/route.ts`
- Database queries using D1
- R2 upload logic

## Quick Reference

### Repository
https://github.com/joerican/aiclosetassistant

### Cloudflare Account
aiclosetassistant@alago.xyz

### Key Files
- `app/page.tsx` - Landing page
- `app/closet/page.tsx` - Main dashboard
- `app/upload/page.tsx` - Upload interface
- `app/shuffle/page.tsx` - Outfit shuffle
- `lib/db/schema.sql` - Database schema
- `wrangler.toml` - Cloudflare configuration
- `DEPLOYMENT.md` - Detailed deployment guide

## Support

For issues or questions:
- Check `DEPLOYMENT.md` for troubleshooting
- Review Cloudflare Pages build logs
- Check Clerk dashboard for auth issues

## Cost

Everything runs on free tiers:
- Cloudflare Pages: Free (unlimited requests)
- Cloudflare D1: Free (5M reads/day, 100K writes/day, 500MB storage)
- Cloudflare R2: Free (10GB storage, 10GB egress/month)
- Clerk: Free (10,000 MAU)

**Total: $0/month** for first few hundred users
