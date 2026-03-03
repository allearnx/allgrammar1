import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // Cache dynamic pages on client for 30s (instant back/forward nav)
    },
  },
};

export default nextConfig;
