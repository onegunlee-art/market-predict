/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@market-predict/ui', '@market-predict/shared-types', '@market-predict/utils'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
