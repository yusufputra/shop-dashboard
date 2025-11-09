import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dshwptmamyucimumdkxl.supabase.co',
        pathname: '/storage/v1/object/public/jewelry-images/**',
      },
    ],
  },
};

export default nextConfig;
