/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@market-predict/ui', '@market-predict/shared-types', '@market-predict/utils'],
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
