import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/one-sentence-a-day",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
