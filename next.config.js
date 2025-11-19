/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
  experimental: {
    skipTrailingSlashRedirect: true,
  },
  skipMiddlewareUrlNormalize: true,
};

module.exports = nextConfig;
