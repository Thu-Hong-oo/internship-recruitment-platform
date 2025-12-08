import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  webpack: (config, { isServer, webpack }) => {
    // Fix for react-pdf - prevent canvas from being bundled on client-side
    if (!isServer) {
      // Set fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
      
      // Alias canvas to false
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
      
      // Ignore canvas module completely (most important fix)
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );
      
      // Replace canvas with stub file using NormalModuleReplacementPlugin
      const stubPath = resolve(__dirname, 'webpack-canvas-stub.js');
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^canvas$/,
          stubPath
        )
      );
    }
    return config;
  },
}

export default nextConfig
