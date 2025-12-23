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
    // TODOS OS HASHES identificados nos erros
    const inlineHashes = [
      // Hashes originais do primeiro erro
      "'sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g='",
      "'sha256-S32hxrqsLARb6e96pPgdB2P8VG8XkvFWBxXgWXvHSvA='", 
      "'sha256-8hO7tSoXJlYIvXcoxgo3D4Xjp4+7fdYOVXDaXwoJNas='",
      "'sha256-WCLn6a4Ggtjf0UQn/QCh7Dp1vtLUDGrT9VW0JnBGkUY='",
      "'sha256-PMBAusH2+D4DYf0z2icL9VfFoDzq6XWYaGPjUw6MVGk='",
      
      // NOVOS HASHES do último erro (23/dez)
      "'sha256-6qFx5EJLMCTSnbPSFjXEuuk3EW0KxLI6pMjcIOAR9MY='",
      "'sha256-swCTKQ8gXPFN5DyuElT+mAMBdyG+Ej70lC09xaW3TXg='",
      "'sha256-y7r17UIuCGESq3pFrOh05DqsZ6rhIUt3iykiLoY5PaQ='",
      
      // Hash adicional comum em Next.js/React
      "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"
    ].join(' ');

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      
      // POLÍTICA DE SCRIPTS - SEGURA
      // Desenvolvimento: permite eval para hot reload
      // Produção: APENAS hashes específicos + Stripe
      `script-src 'self' https://js.stripe.com ${isDev ? "'unsafe-inline' 'unsafe-eval'" : inlineHashes}`.trim(),
      
      "connect-src 'self' https://api.stripe.com https://*.sentry.io",
      "frame-src 'self' https://js.stripe.com",
      
      // Headers adicionais de segurança
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; ');

    const commonHeaders = [
      { 
        key: 'Content-Security-Policy', 
        value: csp 
      },
      { 
        key: 'Referrer-Policy', 
        value: 'strict-origin-when-cross-origin' 
      },
      { 
        key: 'X-Content-Type-Options', 
        value: 'nosniff' 
      },
      { 
        key: 'X-Frame-Options', 
        value: 'DENY' 
      },
      { 
        key: 'X-XSS-Protection', 
        value: '0' 
      },
      // HSTS apenas em produção
      ...(isDev ? [] : [{ 
        key: 'Strict-Transport-Security', 
        value: 'max-age=63072000; includeSubDomains; preload' 
      }]),
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