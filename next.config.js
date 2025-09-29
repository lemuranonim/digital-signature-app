/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    domains: [],
  },
  
  // Experimental features if needed
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig