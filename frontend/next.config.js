/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // API proxy to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.example.com',
        pathname: '/images/**',
      },
    ],
  },
};

module.exports = nextConfig;

