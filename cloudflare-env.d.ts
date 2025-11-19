// Cloudflare environment bindings type definitions

interface CloudflareEnv {
  // D1 Database binding
  DB: D1Database;

  // R2 Bucket binding
  CLOSET_IMAGES: R2Bucket;

  // AI binding
  AI: Ai;

  // Worker binding (for self-reference)
  WORKER: Fetcher;

  // Assets binding
  ASSETS: Fetcher;

  // Cloudflare Images API token (for background removal)
  CLOUDFLARE_IMAGES_TOKEN: string;
}
