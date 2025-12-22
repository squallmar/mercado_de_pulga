const isDev = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' https://js.stripe.com ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ""}`.trim(),
      "connect-src 'self' https://api.stripe.com https://*.sentry.io",
      "frame-src 'self' https://js.stripe.com",
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; ');

    const commonHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '0' },
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

module.exports = nextConfig;
