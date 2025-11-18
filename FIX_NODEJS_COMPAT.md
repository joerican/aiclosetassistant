# Fix Node.js Compatibility Error

## The Error You're Seeing

```
Node.JS Compatibility Error
no nodejs_compat compatibility flag set
```

This happens because Clerk and some other Node.js packages need the `nodejs_compat` flag enabled.

---

## Quick Fix (2 minutes)

### Step 1: Go to Cloudflare Dashboard

1. Visit: https://dash.cloudflare.com
2. Sign in with: **aiclosetassistant@alago.xyz**
3. Navigate to: **Workers & Pages** → **ai-closet-assistant**

### Step 2: Add Compatibility Flag

1. Click **Settings** (top navigation)
2. Click **Functions** (left sidebar)
3. Scroll down to **Compatibility flags**
4. Under **Production**, click **"Configure compatibility flags"**
5. In the text box, enter: `nodejs_compat`
6. Click **"Save"**

### Step 3: Add to Preview Environment Too

1. Still in **Compatibility flags** section
2. Under **Preview**, click **"Configure compatibility flags"**
3. Enter: `nodejs_compat`
4. Click **"Save"**

### Step 4: Trigger New Deployment

The flag only applies to new deployments. Trigger one:

**Option A: From your computer**
```bash
cd "/Users/jorge/Code Projects/aiclosetassistant"
git commit --allow-empty -m "Apply nodejs_compat flag"
git push
```

**Option B: From Cloudflare Dashboard**
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Retry deployment"**

### Step 5: Test

Wait 2-3 minutes for deployment, then visit:
https://ai-closet-assistant.pages.dev

The error should be gone!

---

## What This Flag Does

`nodejs_compat` enables Node.js APIs in Cloudflare Workers, which are needed by:
- Clerk authentication library
- Next.js server functions
- Other Node.js packages

---

## Screenshot Guide

### Finding Compatibility Flags:
```
Dashboard → Workers & Pages → ai-closet-assistant
  → Settings → Functions → Compatibility flags
```

### What to Enter:
```
Production: nodejs_compat
Preview:    nodejs_compat
```

---

## After Fixing

Once the flag is added and a new deployment completes:

✅ Authentication will work
✅ All pages will load correctly
✅ No more Node.js compatibility errors

---

## Additional Configuration (While You're There)

Since you're in the dashboard, you might as well complete the other setup:

### 1. Environment Variables (Settings → Environment Variables)

Add these for **Production**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_test_ZGV2b3RlZC1kcnVtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/closet`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/closet`

### 2. D1 Database Binding (Settings → Functions → D1 database bindings)

- Variable name: `DB`
- D1 database: `closet-db`

### 3. R2 Bucket Binding (Settings → Functions → R2 bucket bindings)

- Variable name: `CLOSET_IMAGES`
- R2 bucket: `closet-images`

Then trigger one more deployment to apply all changes!

---

## Troubleshooting

**Q: I added the flag but still see the error**
A: Make sure you triggered a new deployment after adding the flag

**Q: Where exactly do I add the flag?**
A: Settings → Functions → Compatibility flags → Configure → Enter "nodejs_compat"

**Q: Do I need to add it for both Production and Preview?**
A: Yes, add it to both environments

---

That's it! The fix takes 2 minutes and your site will work perfectly. 🚀
