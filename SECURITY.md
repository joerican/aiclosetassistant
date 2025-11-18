# Security Documentation

## 🔒 Secrets Management Strategy

This project uses **Cloudflare Secrets** (encrypted vault storage) for maximum security in production.

### Security Architecture

```
Local Development (.env.local)
    ↓
    Protected by .gitignore
    ↓
Production (Cloudflare)
    ↓
    Cloudflare Secrets Vault (encrypted, write-only)
```

## 🔐 Secret Storage Locations

### 1. Local Development - `.env.local`

**Status**: ✅ Configured
**Security Level**: High
**Storage**: Local filesystem only

Secrets stored:
- `CLERK_SECRET_KEY` - Clerk authentication secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key (safe to expose)

**Protection**:
- ✅ Listed in `.gitignore`
- ✅ Never committed to Git
- ✅ Only accessible on your local machine

**Access**:
```bash
# Secrets automatically loaded when running
npm run dev
```

### 2. Production - Cloudflare Secrets Vault

**Status**: ✅ Configured
**Security Level**: Maximum
**Storage**: Encrypted Cloudflare vault (write-only)

**What are Cloudflare Secrets?**
- Encrypted at rest and in transit
- **Write-only**: Can't be read back after setting
- Only accessible by your Cloudflare Workers/Pages
- Never exposed in logs or dashboard
- Can only be updated or deleted, not viewed

**Secrets Stored**:

| Secret Name | Status | Storage Method |
|-------------|--------|----------------|
| `CLERK_SECRET_KEY` | ✅ Stored | Cloudflare Secrets Vault |

**How to verify**:
```bash
# List all secrets (shows names only, not values)
npx wrangler secret list
```

**How to update a secret**:
```bash
# Update secret (will prompt for new value)
npx wrangler secret put CLERK_SECRET_KEY
```

**How to delete a secret**:
```bash
# Remove secret from vault
npx wrangler secret delete CLERK_SECRET_KEY
```

### 3. Public Environment Variables (Cloudflare Pages)

**Security Level**: Public (safe to expose)

These should be added in **Cloudflare Pages Dashboard** → **Settings** → **Environment Variables**:

| Variable | Value | Security |
|----------|-------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_ZGV2b3RlZC1kcnVtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ` | Public (safe) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Public |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Public |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/closet` | Public |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/closet` | Public |

**Why these are safe**:
- Prefixed with `NEXT_PUBLIC_` (designed to be public)
- Only contain non-sensitive configuration
- Publishable key is meant to be exposed to browsers

## 🛡️ Security Best Practices

### ✅ What We're Doing Right

1. **Secrets in Vault**
   - `CLERK_SECRET_KEY` stored in encrypted Cloudflare vault
   - Write-only access (can't be read back)
   - Only accessible by Cloudflare Workers runtime

2. **Local Development Protected**
   - `.env.local` in `.gitignore`
   - Secrets never committed to Git
   - Separate from production secrets

3. **Public Keys Properly Handled**
   - `NEXT_PUBLIC_*` variables are intentionally public
   - Only non-sensitive data exposed to browser
   - No secret keys in client-side code

4. **Git Security**
   - `.gitignore` excludes all `.env*` files
   - No secrets in tracked files
   - No secrets in commit history

### 🚨 Critical Security Rules

#### NEVER DO:
- ❌ Commit `.env.local` to Git
- ❌ Share `CLERK_SECRET_KEY` publicly
- ❌ Store secrets in code files
- ❌ Log secrets to console
- ❌ Expose secrets in error messages
- ❌ Store secrets in client-side code
- ❌ Use production secrets in development

#### ALWAYS DO:
- ✅ Use Cloudflare Secrets for production
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use environment variables (never hardcode)
- ✅ Separate dev and production secrets
- ✅ Rotate secrets if exposed
- ✅ Use `NEXT_PUBLIC_` prefix only for public values

## 🔄 Secret Rotation

If a secret is compromised:

### 1. Rotate in Clerk
```bash
# Go to Clerk Dashboard
# https://dashboard.clerk.com
# → API Keys
# → Regenerate Secret Key
# Copy new key
```

### 2. Update Local Environment
```bash
# Edit .env.local
nano .env.local
# Replace old key with new key
```

### 3. Update Cloudflare Vault
```bash
# Update secret in vault
echo "NEW_SECRET_KEY_HERE" | npx wrangler secret put CLERK_SECRET_KEY
```

### 4. Redeploy
```bash
# Trigger new deployment
git commit --allow-empty -m "Rotate secrets"
git push origin main
```

## 📊 Secrets Audit Checklist

Use this checklist to verify security:

### Local Development
- [ ] `.env.local` exists with secrets
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets in tracked files
- [ ] `npm run dev` works with local secrets

### Production Secrets
- [ ] `CLERK_SECRET_KEY` stored in Cloudflare Secrets vault
- [ ] Can verify with `npx wrangler secret list`
- [ ] Public keys added to Cloudflare Pages env vars
- [ ] No secrets exposed in deployment logs

### Git Security
- [ ] Run `git log --all -S "sk_test_"` (should return nothing)
- [ ] Run `git log --all -S "CLERK_SECRET_KEY"` (should only show .env.example)
- [ ] `.gitignore` includes `.env*`
- [ ] No `.env.local` in remote repository

## 🚀 Deployment with Secrets

### Step 1: Verify Secrets are Stored
```bash
# Check that secret is in vault
npx wrangler secret list

# Expected output:
# [
#   {
#     "name": "CLERK_SECRET_KEY",
#     "type": "secret_text"
#   }
# ]
```

### Step 2: Add Public Environment Variables

In **Cloudflare Pages Dashboard**:
1. Go to your project → **Settings** → **Environment Variables**
2. Add for **Production** environment:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_test_ZGV2b3RlZC1kcnVtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/closet`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/closet`

3. Add for **Preview** environment (same values)

### Step 3: Bind Secrets to Pages

In **Cloudflare Pages Dashboard**:
1. Go to **Settings** → **Functions**
2. Under **KV Namespace Bindings**, **D1 Bindings**, **R2 Bindings**
3. Secrets are automatically available via `env.CLERK_SECRET_KEY`

### Step 4: Deploy
```bash
git push origin main
# Cloudflare Pages auto-deploys
# Secrets are automatically injected
```

## 🔍 Accessing Secrets in Code

### Server-Side (Correct ✅)
```typescript
// In API routes or Server Components
import { auth } from '@clerk/nextjs/server';

export default async function handler(req: Request) {
  // Clerk SDK automatically uses CLERK_SECRET_KEY from env
  const { userId } = await auth();

  // Secret is never exposed to client
  return Response.json({ userId });
}
```

### Client-Side (Only Public Keys ✅)
```typescript
// In Client Components
export default function MyComponent() {
  // Only NEXT_PUBLIC_* variables are accessible
  // CLERK_SECRET_KEY is NOT accessible here (correct!)

  return <div>Client component</div>;
}
```

### Accessing Cloudflare Secrets in Workers
```typescript
// In Cloudflare Workers
export default {
  async fetch(request: Request, env: Env) {
    // Access secret from vault
    const secretKey = env.CLERK_SECRET_KEY;

    // Use secret (never log it!)
    return new Response('OK');
  }
};
```

## 🆘 Security Incident Response

### If Secret is Exposed

1. **Immediate Action** (within 5 minutes):
   ```bash
   # Revoke the compromised key in Clerk Dashboard immediately
   # https://dashboard.clerk.com → API Keys → Regenerate
   ```

2. **Rotate Secret** (within 15 minutes):
   ```bash
   # Update local
   nano .env.local

   # Update Cloudflare vault
   echo "NEW_SECRET" | npx wrangler secret put CLERK_SECRET_KEY
   ```

3. **Audit** (within 1 hour):
   - Check Clerk logs for unauthorized access
   - Review user accounts for suspicious activity
   - Check Cloudflare analytics for abnormal traffic

4. **Prevention**:
   - Identify how secret was exposed
   - Update security procedures
   - Document incident

### If Git Contains Secrets

```bash
# WARNING: This rewrites history, coordinate with team
# Remove secret from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS)
git push origin --force --all

# Then: Rotate all secrets immediately
```

## 📚 Additional Security Resources

- **Cloudflare Secrets**: https://developers.cloudflare.com/workers/configuration/secrets/
- **Clerk Security**: https://clerk.com/docs/security/overview
- **Next.js Environment Variables**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Git Security**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure

## ✅ Security Verification

Run these commands to verify security:

```bash
# 1. Check .gitignore includes .env files
grep "\.env" .gitignore

# 2. Verify no secrets in git history
git log --all -S "sk_test_" --oneline

# 3. Verify Cloudflare secrets are set
npx wrangler secret list

# 4. Check no .env.local in remote
git ls-remote --heads origin | grep env

# All should pass ✅
```

---

## 🎯 Current Security Status

| Component | Status | Security Level |
|-----------|--------|----------------|
| Local Development | ✅ Secured | High |
| Cloudflare Secrets | ✅ Configured | Maximum |
| Git Security | ✅ Protected | High |
| Public Variables | ✅ Separated | Appropriate |
| Secret Rotation | ✅ Documented | Ready |

**Overall Security Posture**: ✅ **Production Ready**

Your secrets are stored in Cloudflare's encrypted vault with write-only access. This is the most secure way to handle secrets in Cloudflare infrastructure.
