# AI Closet Assistant

An AI-powered digital closet organizer that helps you manage your wardrobe and discover new outfit combinations.

## Features

- **Smart Upload**: Take photos or upload images of your clothing items
- **Automatic Background Removal**: AI-powered background removal for clean item displays
- **Organized Closet**: Categorize items by type (tops, bottoms, shoes, outerwear, accessories)
- **Outfit Shuffle**: Casino-style slot machine to randomly generate outfit combinations
- **Cloud Sync**: User accounts with cloud storage for access from any device

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with React and Tailwind CSS
- **Hosting**: Cloudflare Pages
- **Authentication**: Clerk
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Background Removal**: @imgly/background-removal (client-side processing)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Clerk account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Clerk keys and Cloudflare credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Cloudflare Setup

```bash
# Create D1 database
npx wrangler d1 create closet-db
npx wrangler d1 execute closet-db --file=./lib/db/schema.sql

# Create R2 bucket
npx wrangler r2 bucket create closet-images

# Deploy to Cloudflare Pages
npm run pages:deploy
```

## Deployment

This app is configured for automatic deployment via Cloudflare Pages. Push to the `main` branch to trigger a deployment.

## License

MIT

## Contact

For questions or support, contact: aiclosetassistant@alago.xyz
