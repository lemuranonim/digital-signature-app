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
  
  // Hapus atau beri komentar pada bagian ini
  // experimental: {
  //   optimizeCss: true,
  // },
}

module.exports = nextConfig