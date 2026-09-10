import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4250kb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
