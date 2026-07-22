import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Allow LAN devices to use Hot Reload WebSocket (fixes ERR_INVALID_HTTP_RESPONSE on HMR).
  allowedDevOrigins: ["192.168.1.117", "10.101.7.25", "127.0.0.1", "localhost"],
  turbopack: {
    root: path.join(__dirname),
  },
  transpilePackages: ["avbridge", "media-chrome"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10gb",
    },
    proxyClientMaxBodySize: "10gb",
  },
};

export default nextConfig;
