import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable strict mode for React
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.bcagency.vn",
      },
    ],
  },
};

export default nextConfig;
