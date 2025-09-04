/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure development server to run on port 8088
  devIndicators: {
    buildActivity: true
  },
  // You can also set other configurations here
  experimental: {
    // Add any experimental features if needed
  }
};

module.exports = nextConfig;
