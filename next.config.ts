import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['calendar.rmu.ac.th', 'localhost:3000'], // ✅ เพิ่ม allowed origins
    },
  },
};

export default nextConfig;