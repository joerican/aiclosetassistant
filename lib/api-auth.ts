import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Validates the API key from request headers.
 * Returns null if valid, or an error Response if invalid.
 *
 * For web app requests (same origin), no API key is required.
 * For mobile/external requests, API key is required.
 */
export async function validateApiKey(request: Request): Promise<Response | null> {
  // Check if request is from the same origin (web app)
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow requests from the web app (same-origin requests won't have origin header in some cases)
  // Also allow if referer is from our domain
  if (origin === 'https://theclosetai.com' ||
      referer?.startsWith('https://theclosetai.com') ||
      origin === 'http://localhost:3000' ||
      referer?.startsWith('http://localhost:3000')) {
    return null; // Web app requests are allowed
  }

  // For external requests (mobile apps, APIs), require API key
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { env } = await getCloudflareContext();
  const validKey = (env as any).API_SECRET_KEY;

  if (!validKey) {
    console.error('API_SECRET_KEY not configured in environment');
    // In development, allow requests if key not configured
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (apiKey !== validKey) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null; // Valid
}
