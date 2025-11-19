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
  skipTrailingSlashRedirect: true,
  skipProxyUrlNormalize: true,
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
