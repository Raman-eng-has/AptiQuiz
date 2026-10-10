const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const BACKEND_URL = process.env.BACKEND_URL || API_URL.replace(/\/api\/?$/, '');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aptiquiz/shared'],
  images: {
    domains: [
      'localhost',
      'aptiquiz-api.onrender.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/socket.io/:path*', destination: `${BACKEND_URL}/socket.io/:path*` },
    ];
  },
};

module.exports = nextConfig;