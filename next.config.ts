import type { NextConfig } from "next";

const isDesktopBuild = process.env.TAURI === "1" || process.env.TAURI === "true";

const nextConfig: NextConfig = {
  ...(isDesktopBuild ? { output: "standalone" as const } : {}),
  images: {
    // Avoid Next image optimizer private-IP issues inside the desktop webview.
    unoptimized: isDesktopBuild,
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
