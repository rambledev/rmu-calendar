import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // เพิ่มส่วนนี้สำหรับ production
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['calendar.rmu.ac.th', 'https://calendar.rmu.ac.th'],
    },
  },
};

export default nextConfig;