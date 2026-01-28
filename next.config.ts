import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['calendar.rmu.ac.th', 'https://calendar.rmu.ac.th'],
    },
  },
  // เพิ่มส่วนนี้
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ]
  },
};

export default nextConfig;