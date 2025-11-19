# OpenNext Cloudflare Adapter Reference

**Last Updated**: 2025-11-19 03:58 EST
**Version**: @opennextjs/cloudflare v1.13.0

## Overview

The `@opennextjs/cloudflare` adapter enables deploying Next.js applications to Cloudflare Workers using the Node.js runtime.

## Installation

**For Existing Apps:**
```bash
npm install @opennextjs/cloudflare wrangler
```

## Runtime Requirements

- **IMPORTANT**: Requires **Node.js runtime**, NOT Edge runtime
- Edge runtime intentionally constrains Node.js APIs
- We use Node.js runtime for full feature support

## Supported Next.js Versions

- All minor/patch versions of Next.js v15
- Latest minor of v14
- **We're using**: Next.js 16.0.3 (latest)

## Fully Supported Features

✅ App Router and Pages Router
✅ Route Handlers (API routes)
✅ Dynamic routing
✅ Server-Side Rendering (SSR)
✅ Static Site Generation (SSG)
✅ Middleware
✅ Image optimization
✅ Partial Prerendering
✅ ISR (Incremental Static Regeneration)

## Configuration

### wrangler.jsonc Structure

```jsonc
{
  "name": "your-app-name",
  "main": ".open-next/worker.js",  // OpenNext output
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],

  // Bindings
  "d1_databases": [...],
  "r2_buckets": [...],
  "ai": { "binding": "AI" },
  "images": { "binding": "IMAGES" }
}
```

## Deployment Commands

```bash
# Build only
npx opennextjs-cloudflare build

# Build and preview locally
npx opennextjs-cloudflare preview

# Build and deploy
npx opennextjs-cloudflare deploy
```

**Our Deploy Script:**
```json
"deploy": "NEXT_PUBLIC_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) opennextjs-cloudflare build && opennextjs-cloudflare deploy"
```

## Size Limitations

- **Free Plan**: 3 MiB (gzip-compressed)
- **Paid Plan**: 10 MiB (gzip-compressed)
- Only gzip-compressed size counts toward limit
- **Our Current Size**: ~2 MiB (well under limit)

## Build Output

- Output directory: `.open-next/`
- Worker file: `.open-next/worker.js`
- Assets directory: `.open-next/assets/`

## Important Notes

1. **Node.js Runtime**: Always use Node.js runtime, not Edge
2. **Compatibility Flags**: Include `nodejs_compat` for Node.js APIs
3. **Environment Variables**: Use `NEXT_PUBLIC_` prefix for client-side vars
4. **Build Time**: Set env vars before build, not after

## Troubleshooting

**If deployment fails:**
1. Check worker size (should be under limit)
2. Verify compatibility_date is recent
3. Ensure all bindings are correctly configured
4. Check for deprecated Next.js features

## References

- Official Docs: https://opennext.js.org/cloudflare
- GitHub: https://github.com/opennextjs/opennextjs-cloudflare
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
