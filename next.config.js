/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudinary
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  
  // Desativar temporariamente para resolver hydration errors
  reactStrictMode: false,
  
  // Webpack config para evitar erros de módulos
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
  
  // NÃO TEM headers() - SEM CSP por 24h
};

module.exports = nextConfig;