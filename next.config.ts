import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gqcnmypvbrcdqzmxnzho.supabase.co',
        pathname: '/storage/v1/object/public/jewelry-images/**',
      },
      {
        protocol: 'https',
        hostname: 'qghgvzvwmvfmnlxlrpei.supabase.co',
        pathname: '/storage/v1/object/public/jewelry-images/**',
      },
    ],
  },
};

export default nextConfig;
