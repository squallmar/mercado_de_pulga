import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    // Security headers applied to all routes
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      // Allow Stripe, Cloudinary, Sentry where needed; keep dev-friendly inline allowances
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // Next.js dev overlay and some libs may need eval/inline in development
      `script-src 'self' https://js.stripe.com ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ""}`.trim(),
      "connect-src 'self' https://api.stripe.com https://*.sentry.io",
      "frame-src 'self' https://js.stripe.com",
      // Upgrade to HTTPS in production
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; ');

    const commonHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '0' }, // modern browsers rely on CSP
      // Only enable HSTS in production and when served over HTTPS
      ...(isDev
        ? []
        : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
    ];

    return [
      {
        source: '/:path*',
        headers: commonHeaders,
      },
    ];
  },
};

export default nextConfig;
