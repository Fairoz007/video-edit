import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3847';

const nextConfig: NextConfig = {
  transpilePackages: ['@docuforge/convex'],
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      { source: '/health', destination: `${apiUrl}/health` },
      { source: '/exports/:path*', destination: `${apiUrl}/exports/:path*` },
      { source: '/cache/:path*', destination: `${apiUrl}/cache/:path*` },
    ];
  },
};

export default nextConfig;
