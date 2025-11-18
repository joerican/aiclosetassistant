# Connect GitHub to Cloudflare Pages - Step by Step

This will set up automatic deployments: **Push to GitHub → Auto-deploy to Cloudflare Pages**

**Time required**: 10 minutes

---

## Step 1: Open Cloudflare Dashboard (1 min)

1. Go to: **https://dash.cloudflare.com**
2. Sign in with: **aiclosetassistant@alago.xyz**
3. Select your account if prompted

---

## Step 2: Create Pages Project (2 min)

1. In the left sidebar, click **"Workers & Pages"**
2. Click the **"Create application"** button (top right)
3. Click the **"Pages"** tab
4. Click **"Connect to Git"**

---

## Step 3: Connect GitHub (1 min)

1. Click **"Connect GitHub"**
2. A popup will open asking for GitHub authorization
3. Click **"Authorize Cloudflare Pages"**
4. You may need to select your GitHub account: **joerican**
5. Choose **"All repositories"** or select **"aiclosetassistant"**
6. Click **"Install & Authorize"**

---

## Step 4: Select Repository (1 min)

1. You'll see a list of your repositories
2. Find and click: **"joerican/aiclosetassistant"**
3. Click **"Begin setup"**

---

## Step 5: Configure Build Settings (2 min)

Fill in these exact values:

**Project name**: `ai-closet-assistant` (or any name you want)

**Production branch**: `main`

**Framework preset**: Select **"Next.js"** from dropdown

**Build command**:
```
npm run pages:build
```

**Build output directory**:
```
.vercel/output/static
```

**Root directory**: (leave empty)

**Environment variables** - Click "Add variable" for each:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_ZGV2b3RlZC1kcnVtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/closet` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/closet` |
| `NODE_VERSION` | `18` |

**Note**: We're NOT adding `CLERK_SECRET_KEY` here - it's already in Cloudflare Secrets vault (more secure)

---

## Step 6: Deploy (1 min)

1. Click **"Save and Deploy"**
2. Cloudflare will start building your site
3. Wait 2-3 minutes for the build to complete
4. You'll see "✅ Success! Deployment is live"

---

## Step 7: Configure D1 and R2 Bindings (2 min)

After the first deployment completes:

1. In your Pages project, click **"Settings"** (top navigation)
2. Scroll down and click **"Functions"** in the left sidebar
3. Under **"D1 database bindings"**, click **"Add binding"**:
   - Variable name: `DB`
   - D1 database: Select **"closet-db"** from dropdown
   - Click **"Save"**

4. Under **"R2 bucket bindings"**, click **"Add binding"**:
   - Variable name: `CLOSET_IMAGES`
   - R2 bucket: Select **"closet-images"** from dropdown
   - Click **"Save"**

5. Scroll down and click **"Save"**

---

## Step 8: Trigger a New Deployment (1 min)

The bindings only take effect on new deployments:

1. Go to **"Deployments"** tab
2. Click **"Manage deployment"** on the latest deployment
3. Click **"Retry deployment"**

**OR** trigger a new deployment from your computer:

```bash
cd "/Users/jorge/Code Projects/aiclosetassistant"
git commit --allow-empty -m "Trigger deployment with bindings"
git push origin main
```

---

## Step 9: Get Your Live URL

1. Go to your Pages project overview
2. You'll see your live URL, like:
   ```
   https://ai-closet-assistant.pages.dev
   ```
3. Click it to visit your live site!

---

## Step 10: Update Clerk with Production URL (1 min)

1. Go to **https://dashboard.clerk.com**
2. Select your **"AI Closet Assistant"** application
3. Click **"Domains"** in the left sidebar
4. Click **"Add domain"**
5. Enter your Cloudflare Pages URL:
   ```
   https://ai-closet-assistant.pages.dev
   ```
   (or whatever your actual URL is)
6. Click **"Add domain"**

---

## ✅ Done! Auto-Deploy is Set Up

### What Happens Now:

Every time you push to GitHub:
```bash
git add .
git commit -m "Update something"
git push origin main
```

Cloudflare automatically:
1. ✅ Detects the push
2. ✅ Builds your Next.js app
3. ✅ Deploys to your live URL
4. ✅ Takes 2-3 minutes total

### Your Live URLs:

- **Production**: `https://ai-closet-assistant.pages.dev` (or your custom URL)
- **GitHub**: https://github.com/joerican/aiclosetassistant
- **Cloudflare Dashboard**: https://dash.cloudflare.com

---

## 🧪 Test Your Live Site

Visit your Cloudflare Pages URL and test:

1. **Landing page** - Should load
2. **Sign Up** - Create a test account
3. **Sign In** - Log in with test account
4. **Closet** - Should show empty state
5. **Upload** - Should show upload page
6. **Shuffle** - Should show slot machine

---

## 🔍 Monitoring Deployments

### View Deployment Logs:

1. Go to Cloudflare Pages project
2. Click **"Deployments"**
3. Click any deployment to see logs
4. Check for errors if deployment fails

### Common Issues:

**Build fails**:
- Check environment variables are set correctly
- Look at build logs for errors
- Verify Node version is 18

**Site loads but auth doesn't work**:
- Check Clerk domain is added
- Verify environment variables
- Check browser console for errors

**Database/Images don't work**:
- Verify D1 binding is set (`DB`)
- Verify R2 binding is set (`CLOSET_IMAGES`)
- Trigger new deployment after adding bindings

---

## 📊 What's Already Configured

✅ **GitHub Repository**: https://github.com/joerican/aiclosetassistant
✅ **All code pushed and ready**
✅ **D1 Database**: `closet-db` created and schema applied
✅ **R2 Bucket**: `closet-images` created
✅ **Secrets**: `CLERK_SECRET_KEY` stored in vault
✅ **Build config**: `wrangler.toml` configured
✅ **Package scripts**: `pages:build` command ready

You just need to click through the Cloudflare dashboard to connect everything!

---

## 🆘 Need Help?

If something goes wrong:

1. Check deployment logs in Cloudflare Pages
2. Verify all environment variables are set
3. Make sure D1 and R2 bindings are configured
4. Check that Clerk domain is added
5. Look at browser console for client-side errors

**Everything is ready to go - just follow the steps above!** 🚀
