import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: [
    "@deutschmark/toolkit-client",
    "@deutschmark/widget-config",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
