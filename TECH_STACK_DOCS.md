# Tech Stack Documentation Links

This document provides quick access to official documentation for all technologies used in the AI Closet Assistant project.

## Core Framework

### Next.js 16
- **Official Docs**: https://nextjs.org/docs
- **App Router**: https://nextjs.org/docs/app
- **API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Server Components**: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- **GitHub**: https://github.com/vercel/next.js

### React
- **Official Docs**: https://react.dev/
- **Hooks**: https://react.dev/reference/react/hooks
- **GitHub**: https://github.com/facebook/react

## Hosting & Infrastructure

### Cloudflare Pages
- **Official Docs**: https://developers.cloudflare.com/pages/
- **Get Started**: https://developers.cloudflare.com/pages/get-started/
- **Framework Guides**: https://developers.cloudflare.com/pages/framework-guides/

### OpenNext for Cloudflare
- **Official Docs**: https://opennext.js.org/cloudflare
- **GitHub**: https://github.com/opennextjs/opennextjs-cloudflare
- **npm**: https://www.npmjs.com/package/opennextjs-cloudflare

### Cloudflare Workers
- **Official Docs**: https://developers.cloudflare.com/workers/
- **Runtime APIs**: https://developers.cloudflare.com/workers/runtime-apis/
- **Bindings**: https://developers.cloudflare.com/workers/runtime-apis/bindings/

## Database & Storage

### Cloudflare D1 (SQLite)
- **Official Docs**: https://developers.cloudflare.com/d1/
- **Get Started**: https://developers.cloudflare.com/d1/get-started/
- **SQL Reference**: https://developers.cloudflare.com/d1/platform/client-api/
- **Migrations**: https://developers.cloudflare.com/d1/reference/migrations/

### Cloudflare R2 (Object Storage)
- **Official Docs**: https://developers.cloudflare.com/r2/
- **Get Started**: https://developers.cloudflare.com/r2/get-started/
- **API Reference**: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- **Bucket Configuration**: https://developers.cloudflare.com/r2/buckets/

## AI & Image Processing

### Cloudflare Workers AI
- **Official Docs**: https://developers.cloudflare.com/workers-ai/
- **Models**: https://developers.cloudflare.com/workers-ai/models/
- **Llama 3.2 11B Vision**: https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
- **Get Started**: https://developers.cloudflare.com/workers-ai/get-started/

### Cloudflare AI - Background Removal (RMBG-1.4)
- **Model Page**: https://developers.cloudflare.com/workers-ai/models/rmbg-1.4/
- **Image Processing**: https://developers.cloudflare.com/workers-ai/tutorials/remove-image-background/

### Cloudflare Images API
- **Official Docs**: https://developers.cloudflare.com/images/
- **Transformations**: https://developers.cloudflare.com/images/transform-images/
- **Resize Images**: https://developers.cloudflare.com/images/transform-images/resize/
- **Format Conversion**: https://developers.cloudflare.com/images/transform-images/format-conversion/
- **Optimization**: https://developers.cloudflare.com/images/transform-images/optimize/

## Styling & UI

### Tailwind CSS
- **Official Docs**: https://tailwindcss.com/docs
- **Installation**: https://tailwindcss.com/docs/installation
- **Utility Classes**: https://tailwindcss.com/docs/utility-first
- **Customization**: https://tailwindcss.com/docs/configuration
- **Dark Mode**: https://tailwindcss.com/docs/dark-mode

### Lucide React (Icons)
- **Official Website**: https://lucide.dev/
- **Icon Library**: https://lucide.dev/icons/
- **React Guide**: https://lucide.dev/guide/packages/lucide-react
- **GitHub**: https://github.com/lucide-icons/lucide
- **npm**: https://www.npmjs.com/package/lucide-react

## Authentication

### Clerk
- **Official Docs**: https://clerk.com/docs
- **Next.js Integration**: https://clerk.com/docs/quickstarts/nextjs
- **User Management**: https://clerk.com/docs/users/overview
- **GitHub**: https://github.com/clerk/javascript

## Development Tools

### Wrangler CLI
- **Official Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Commands**: https://developers.cloudflare.com/workers/wrangler/commands/
- **Configuration**: https://developers.cloudflare.com/workers/wrangler/configuration/
- **Install**: https://developers.cloudflare.com/workers/wrangler/install-and-update/

### TypeScript
- **Official Docs**: https://www.typescriptlang.org/docs/
- **Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **Type Declarations**: https://www.typescriptlang.org/docs/handbook/2/type-declarations.html

## Additional Resources

### CSS Custom Properties
- **MDN Guide**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **Can I Use**: https://caniuse.com/css-variables

### HTML5 Datalist
- **MDN Guide**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
- **Can I Use**: https://caniuse.com/datalist

### Web APIs
- **FormData API**: https://developer.mozilla.org/en-US/docs/Web/API/FormData
- **File API**: https://developer.mozilla.org/en-US/docs/Web/API/File
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

## Quick Start Guides

### Getting Started with D1
```bash
# Create database
wrangler d1 create closet-db

# Run migrations locally
wrangler d1 execute closet-db --local --file=./migrations/schema.sql

# Run migrations in production
wrangler d1 execute closet-db --remote --file=./migrations/schema.sql
```

### Getting Started with R2
```bash
# Create bucket
wrangler r2 bucket create closet-images

# List buckets
wrangler r2 bucket list
```

### Deploying to Cloudflare Pages
```bash
# Build and deploy
npm run deploy

# View logs
wrangler tail --format=pretty
```

## Community & Support

- **Cloudflare Discord**: https://discord.cloudflare.com/
- **Cloudflare Community**: https://community.cloudflare.com/
- **Next.js Discord**: https://nextjs.org/discord
- **Stack Overflow**: Search tags `cloudflare-workers`, `nextjs`, `tailwindcss`, etc.
