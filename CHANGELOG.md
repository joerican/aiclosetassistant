# Changelog

All notable changes to the AI Closet Assistant project will be documented in this file.

## [Unreleased]

### Added - 2025-01-19 (Latest Update: Native Camera Integration & Icon Updates)

#### Upload Experience Improvements
- **Native Camera Integration**: Replaced WebRTC camera with native camera picker using HTML5 `capture="environment"` attribute
  - Direct access to device camera without permission prompts
  - Cleaner user experience on mobile devices
  - Simplified codebase by removing WebRTC implementation
- **Button Reordering**: Take Photo button now appears first (top/left), Upload from Device second (bottom/right)
  - Prioritizes camera usage for mobile-first experience
  - Maintains consistent dual-option layout

#### Modern Icon System
- **Lucide Icons Integration**: Replaced all emojis with modern Lucide React icons
  - CoatHanger icon (from @lucide/lab) for empty closet state
  - Hourglass icon for loading states
  - Trousers icon (from @lucide/lab) for bottoms category
  - Upload and Camera icons on upload page
  - Trash2 icon for delete functionality
  - All icons use 1.5 stroke width for elegant appearance
- **Visual Effects**: Added vertical scanning animation during AI image processing
  - Gold scan line with glow effect that moves top-to-bottom
  - Shimmer effect on "Analyzing with AI..." text
  - CSS keyframe animations for smooth visual feedback

#### Delete Functionality
- **Complete Delete Implementation**: New delete feature removes items from both database and storage
  - DELETE endpoint at `/api/delete-item/route.ts`
  - Removes all associated images from R2 (original, processed, thumbnail)
  - Clean UI with red trash icon (icon-only button)
  - Confirmation dialog prevents accidental deletion
  - No success popup (clean UX - item disappears on success)

#### Duplicate Detection System
- **Smart Duplicate Prevention**: SHA-256 image hashing to detect duplicates before AI processing
  - Client-side hashing using Web Crypto API
  - Check for duplicates BEFORE running AI analysis (saves costs)
  - `/api/check-duplicate/route.ts` endpoint for fast duplicate lookup
  - User-friendly dialog with item details when duplicate detected
  - Option to proceed with duplicate upload if desired
  - Database migration: `add-image-hash.sql` with indexed image_hash field

### Added - 2025-01-19 (Previous Update: White & Gold Luxury Theme)

#### Design System Evolution - White & Gold
- **Refined Color Palette**: Transitioned from warm neutrals to a luxurious White & Gold theme
  - Pure White (#FFFFFF) - Primary background for clean, modern aesthetic
  - Soft White (#FAFAFA) - Card backgrounds with subtle distinction
  - Gold (#D4AF37) - Premium accent color for buttons, icons, and highlights
  - Rich Gold (#C5A028) - Interactive hover states
  - Dark Gold (#B8941F) - Gradient depth
  - Light Gold (#F5E6D3) - Subtle background accents
  - Sophisticated text hierarchy:
    - Primary (#2D2D2D) - Headlines and important content
    - Secondary (#6B6B6B) - Body text and labels
    - Tertiary (#9E9E9E) - Subtle descriptions
- **Luxury Enhancement Features**:
  - Gold-tinted shadows on buttons (`rgba(212, 175, 55, 0.3)`) for premium depth
  - Smooth hover transitions between gold shades
  - Gradient gold heading on home page (Gold → Rich Gold → Dark Gold)
  - Strategic use of gold for visual hierarchy and call-to-action elements
  - Client Component optimization for interactive hover effects

### Added - 2025-01-19 (Initial Updates)

#### New Fields & Features
- Added `size` field to clothing items database with comprehensive US sizing options
  - Tops/Outerwear: XS, S, M, L, XL, XXL, XXXL, XXXXL
  - Women's Bottoms: 00/24 through 24/37 with length options (Crop, Short, Regular, Long, Extra Long)
  - Men's Bottoms: 28-44 waist with inseam lengths (28, 30, 32, 34, 36)
  - Women's Shoes: 5-12 with half sizes
  - Men's Shoes: 6-15 with half sizes
  - "Other" option for custom sizing
- Added `description` field for detailed item information
- Added `notes` field for personal notes about items
- Added gender/type selector for bottoms and shoes to determine appropriate sizing options

#### UI/UX Improvements
- **Simplified Upload Form**: Reduced friction by making only 3 fields required
  - Required: Category, Type (subcategory), Colors
  - Optional fields moved to collapsible "Add More Details" section
- **Scanning Overlay Effect**: Visual feedback during AI processing with animated scan line
- **Automatic Background Removal**: Removed manual button, now processes automatically in parallel with AI analysis
- **Smart Auto-fill**: AI-detected values automatically populate Category, Type, and Colors
- **Autocomplete for Type**: HTML5 datalist provides suggestions while typing
- **Size Selector Intelligence**: Dynamic size options that adapt based on category and gender selection
- **Background-Removed Preview**: Automatically shows processed image in confirmation form

#### Design System Overhaul
- **New Color Palette**: Elegant warm neutral color scheme with clean white background
  - Primary Background: Pure White (#FFFFFF) for main pages
  - Card Background: Parchment (#EDEDE9) for cards and sections
  - Accent Color: Almond Silk (#D5BDAF) for buttons and active states
  - Border Color: Bone (#D6CCC2) for borders and dividers
  - Almond Cream (#E3D5CA) reserved for future use
  - Linen (#F5EBE0) reserved for future use
- **Modern Icons**: Replaced emojis with Lucide React icons
  - Camera icon for Smart Upload
  - Sparkles icon for Background Removal
  - Shuffle icon for Outfit Shuffle
  - Thin stroke width (1.5) for elegant appearance
- **Consistent Styling Across All Pages**: Applied cohesive design system to all pages
  - Home page: Clean white background with parchment cards
  - Upload page: White background with warm neutral accents
  - Closet page: Consistent card styling and button colors
  - Shuffle page: Uniform slot machine and item card styling
  - Replaced all purple/pink accents with almond silk (#D5BDAF)
  - Standardized text colors: gray-900 for headings, gray-700 for body, gray-600 for secondary
  - Removed dark mode support (to be re-implemented later)

#### Backend Updates
- Updated `/api/upload-item` route to handle new `description` and `notes` fields
- Added SQL binding for size, description, and notes in INSERT statement
- Enhanced logging for debugging field values
- Created temporary `/api/clear-r2` endpoint for bulk R2 cleanup (removed after use)

#### Database Migrations
- Created `add-size-field.sql` migration
- Created `add-description-notes.sql` migration
- Successfully applied to both local and production databases

#### Documentation
- Updated README.md with:
  - New features and capabilities
  - Design system documentation (colors, icons)
  - Updated tech stack information
  - Comprehensive size system details
- Created CHANGELOG.md for tracking project evolution
- Created TECH_STACK_DOCS.md with comprehensive links to:
  - All technology documentation (Next.js, React, Cloudflare services)
  - API references and guides
  - Quick start commands for common operations
  - Community and support resources

#### Cleanup & Maintenance
- **Database**: Cleared all 16 test entries from production D1 database
- **Storage**: Deleted all 54 test images from R2 bucket (original/, processed/, thumbnails/)
- **Code**: Removed temporary cleanup scripts and API routes after use
- Fresh start with clean production environment

### Changed
- Updated Next.js from 14 to 16
- Modified form validation to only require Category, Type, and Colors
- Changed background removal from manual button click to automatic parallel processing
- Refactored upload flow to show uploaded image with scanning overlay during processing
- Updated CSS variables to use warm neutral palette across light and dark modes

### Technical Details

#### File Changes
- `/types/index.ts`: Added size, description, and notes to ClothingItem interface
- `/app/upload/UploadClient.tsx`: Complete rewrite with new form layout and size selector logic
- `/app/api/upload-item/route.ts`: Added handling for description and notes fields
- `/app/globals.css`: New color scheme with CSS custom properties
- `/app/page.tsx`: Updated to use new design system and Lucide icons
- `/migrations/add-size-field.sql`: New migration file
- `/migrations/add-description-notes.sql`: New migration file

#### Dependencies Added
- `lucide-react`: Modern icon library for elegant UI

### Performance
- Parallel processing of AI analysis and background removal reduces perceived wait time
- Optimized image handling with Cloudflare Images API (WebP conversion, automatic resizing)
  - Original images: max 1200px width, 85% quality
  - Processed images: max 800px width, 90% quality
  - Thumbnails: 300px width, 80% quality

## [Previous] - Before 2025-01-19

### Initial Release Features
- Smart upload with image capture
- Background removal capability
- Basic clothing item management
- Casino-style outfit shuffle
- Cloudflare D1 database integration
- Cloudflare R2 storage
- Clerk authentication
- Next.js App Router architecture
