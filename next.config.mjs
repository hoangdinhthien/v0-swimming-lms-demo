/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // This helps reduce function count by optimizing builds
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Ensure proper trailing slash handling
  trailingSlash: false,
  // Optimize webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for potential module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    if (isServer) {
      // Optimize server bundle to reduce function splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            default: {
              chunks: "all",
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  // Better build output configuration
  output: "standalone",
};

export default nextConfig;
