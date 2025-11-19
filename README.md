# AI Closet Assistant

An AI-powered digital closet organizer with a clean, modern, and elegant interface that helps you manage your wardrobe and discover new outfit combinations.

## Features

- **Smart Upload**: Take photos or upload images of your clothing items with AI-powered analysis
- **Automatic Background Removal**: Seamless background removal during upload for clean item displays
- **AI Image Analysis**: Llama 3.2 11B Vision model automatically detects category, subcategory, colors, and details
- **Streamlined Form**: Only 3 required fields (Category, Type, Color) with optional detailed fields
- **Comprehensive Size System**: Standard US sizing for all categories
  - Tops/Outerwear: XS - XXXXL
  - Bottoms: Women's (00/24 - 24/37) with lengths, Men's (28-44 waist) with inseam lengths
  - Shoes: Women's (5-12) and Men's (6-15) with half sizes
- **Organized Closet**: Categorize items by type (tops, bottoms, shoes, outerwear, accessories)
- **Outfit Shuffle**: Casino-style slot machine to randomly generate outfit combinations
- **Cloud Sync**: User accounts with cloud storage for access from any device

## Design System

### Color Palette (White & Gold Luxury)
- **Pure White**: `#FFFFFF` - Clean, elegant primary background
- **Soft White**: `#FAFAFA` - Subtle card backgrounds
- **Gold**: `#D4AF37` - Premium accent color for buttons and highlights
- **Rich Gold**: `#C5A028` - Hover states and interactions
- **Dark Gold**: `#B8941F` - Gradient accents
- **Light Gold**: `#F5E6D3` - Subtle highlights
- **Text Colors**:
  - Primary: `#2D2D2D` - Headings and important text
  - Secondary: `#6B6B6B` - Body text and labels
  - Tertiary: `#9E9E9E` - Subtle descriptions

### Visual Design
- **Icons**: Lucide React icons with thin stroke width (1.5) for elegance
- **Shadows**: Subtle gold-tinted shadows on buttons for luxury depth
- **Hover Effects**: Smooth transitions between gold shades
- **Typography**: Clear hierarchy with semantic color usage

## Tech Stack

- **Frontend**: Next.js 16 (App Router) with React and Tailwind CSS
- **Hosting**: Cloudflare Pages via OpenNext
- **AI**: Cloudflare Workers AI (Llama 3.2 11B Vision Instruct)
- **Authentication**: Clerk
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Image Processing**: Cloudflare Images API (automatic WebP conversion and resizing)
- **Background Removal**: Cloudflare AI (RMBG-1.4)
- **Icons**: Lucide React

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
