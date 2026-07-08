import type { NextConfig } from "next";

/**
 * Bundle analyzer integration — enabled via ANALYZE=true npm run build.
 * Uses require() since Next.js loads config as CJS (top-level await breaks it).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ba = require("@next/bundle-analyzer");
const withBundleAnalyzer: (config: NextConfig) => NextConfig =
  process.env.ANALYZE === "true" ? ba.default({ enabled: true }) : (config: NextConfig) => config;

/**
 * 🌊 Next.js 16.x Configuration
 * Optimized for AquastreamUI Experience.
 */
const nextConfig: NextConfig = withBundleAnalyzer({
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.brandfolder.io",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },

  // 🏎️ ETag generation for conditional GET (304 Not Modified) support
  generateEtags: true,

  experimental: {
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: "25mb",
    },
    proxyClientMaxBodySize: 26214400, // 25MB
  },

  // Force Turbopack to include sharp native binaries in deployment
  outputFileTracingIncludes: {
    "/admin/**": [
      "./node_modules/@img/sharp-linux-x64/**",
      "./node_modules/@img/sharp-libvips-linux-x64/**",
    ],
  },

  async redirects() {
    return [
      // /facilities/{category}/{slug} → /{slug}
      // Google indexed these before the flat URL migration. Edge-level 301
      // consolidates link equity without waiting for Next.js server rendering.
      {
        source: "/facilities/:category/:slug",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        has: [
          {
            type: "header",
            key: "user-agent",
            value: ".*(bingbot|BingPreview|msnbot).*",
          },
        ],
        headers: [
          {
            key: "cache-control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Vary",
            value: "User-Agent",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.splashdeals.rs https://f7t7eeiv4kcyjvws.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.splashdeals.rs https://f7t7eeiv4kcyjvws.public.blob.vercel-storage.com https://grainy-gradients.vercel.app; font-src 'self' data:; connect-src 'self' https://www.splashdeals.rs https://vercel.com https://blob.vercel-storage.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
});

export default nextConfig;
