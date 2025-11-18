# Deployment Guide

This guide walks you through deploying AI Closet Assistant to Cloudflare Pages with D1 database and R2 storage.

## Prerequisites

- GitHub account with repository: https://github.com/joerican/aiclosetassistant
- Cloudflare account: aiclosetassistant@alago.xyz
- Clerk account for authentication
- Node.js 18+ installed locally

## Step 1: Set Up Clerk Authentication

1. Go to https://clerk.com and sign in
2. Create a new application
3. In the Clerk Dashboard, get your keys from the "API Keys" section
4. You'll need:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Step 2: Create Cloudflare D1 Database

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create closet-db

# Note the database_id from the output
# Update wrangler.toml with the database_id

# Run the schema to create tables
npx wrangler d1 execute closet-db --file=./lib/db/schema.sql
```

## Step 3: Create Cloudflare R2 Bucket

```bash
# Create R2 bucket for image storage
npx wrangler r2 bucket create closet-images

# Update wrangler.toml with the bucket name
```

## Step 4: Update wrangler.toml

Edit `wrangler.toml` and uncomment the D1 and R2 sections, adding your IDs:

```toml
[[d1_databases]]
binding = "DB"
database_name = "closet-db"
database_id = "your-database-id-from-step-2"

[[r2_buckets]]
binding = "CLOSET_IMAGES"
bucket_name = "closet-images"
```

## Step 5: Connect GitHub to Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Select your account (aiclosetassistant@alago.xyz)
3. Navigate to "Workers & Pages" > "Create application" > "Pages"
4. Click "Connect to Git"
5. Select your GitHub account and choose the `joerican/aiclosetassistant` repository
6. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/`
   - **Node version**: 18 or higher

## Step 6: Add Environment Variables in Cloudflare

In the Cloudflare Pages settings, add these environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/closet
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/closet
```

## Step 7: Bind D1 and R2 to Pages

1. In Cloudflare Pages project settings, go to "Settings" > "Functions"
2. Under "D1 database bindings", add:
   - Variable name: `DB`
   - D1 database: Select `closet-db`
3. Under "R2 bucket bindings", add:
   - Variable name: `CLOSET_IMAGES`
   - R2 bucket: Select `closet-images`

## Step 8: Deploy

### Automatic Deployment

Every push to the `main` branch will automatically trigger a deployment on Cloudflare Pages.

```bash
git add .
git commit -m "Deploy to Cloudflare Pages"
git push origin main
```

### Manual Deployment

```bash
npm run pages:deploy
```

## Step 9: Configure Custom Domain

1. In Cloudflare Pages, go to "Custom domains"
2. Add `aiclosetassistant.com`
3. Follow the DNS configuration instructions
4. Wait for DNS propagation (usually 5-10 minutes)

## Step 10: Update Clerk URLs

1. Go back to Clerk Dashboard
2. Update the allowed redirect URLs to include your Cloudflare Pages domain:
   - `https://your-app.pages.dev`
   - `https://aiclosetassistant.com`
3. Update the allowed origins as well

## Testing

After deployment:

1. Visit your Cloudflare Pages URL
2. Test sign up flow
3. Test image upload (camera and file upload)
4. Test background removal
5. Test outfit shuffle feature

## Troubleshooting

### Build Fails

- Check that Node.js version is 18+
- Verify all dependencies are installed
- Check build logs in Cloudflare Pages dashboard

### D1 Database Not Working

- Verify database binding is correctly set up
- Check that schema was applied: `npx wrangler d1 execute closet-db --command="SELECT name FROM sqlite_master WHERE type='table';"`

### R2 Images Not Loading

- Verify R2 bucket binding is set up
- Check CORS settings on R2 bucket if needed
- Consider making bucket public for image serving

### Authentication Issues

- Verify Clerk environment variables are set correctly
- Check that redirect URLs match in Clerk dashboard
- Clear browser cache and cookies

## Monitoring

- Cloudflare Analytics: Monitor traffic and performance
- Cloudflare Logs: Check for errors in Workers logs
- Clerk Dashboard: Monitor authentication events

## Cost Estimate (Free Tier)

- **Cloudflare Pages**: Free (unlimited requests)
- **Cloudflare D1**: Free (5M reads/day, 100K writes/day)
- **Cloudflare R2**: Free (10GB storage, 10GB egress/month)
- **Clerk**: Free (10,000 monthly active users)

Total: $0/month for early-stage usage

## Next Steps

- Implement actual API routes for items CRUD operations
- Add real image storage to R2
- Implement outfit saving to D1
- Add user profile management
- Implement wear history tracking
- Add outfit recommendations based on weather/occasion
