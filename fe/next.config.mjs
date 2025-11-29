/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Only use static export for production builds
  ...(process.env.NODE_ENV === 'production' && { 
    output: 'export',
    trailingSlash: true, // Ensure /jobs/placeholder/index.html is created
  }),
  images: {
    unoptimized: true,
  },
}

export default nextConfig
