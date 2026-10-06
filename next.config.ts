import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sources are the pre-optimised WebP masters written by `npm run media`.
    localPatterns: [{ pathname: "/media/**", search: "" }],
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80, 90],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [96, 160, 256, 384, 480],
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
