import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling react-pdf and fontkit.
  // When bundled, webpack picks fontkit's BROWSER build (dist/browser-module.mjs)
  // which does NOT export fontkit.open() → silent Helvetica fallback → garbled Cyrillic.
  // With serverExternalPackages, Node.js resolves fontkit via the "node" export condition
  // → dist/module.mjs → fontkit.open() works correctly.
  serverExternalPackages: ['@react-pdf/renderer', '@react-pdf/font', 'fontkit'],
  experimental: {
    outputFileTracingIncludes: {
      '/api/proposals/create':        ['./public/fonts/**'],
      '/api/proposals/[id]':          ['./public/fonts/**'],
      '/api/proposals/download/[id]': ['./public/fonts/**'],
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection",       value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
