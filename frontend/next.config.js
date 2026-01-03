/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  // Note: API routes in pages/api/ take precedence over rewrites
  // The API routes proxy requests using BACKEND_URL env var
};

module.exports = nextConfig;
