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
  // Use dynamic routing with fewer functions
  async rewrites() {
    return [
      {
        source: "/dashboard/manager/:path*",
        destination: "/dashboard/manager",
      },
      {
        source: "/dashboard/admin/:path*",
        destination: "/dashboard/admin",
      },
      {
        source: "/dashboard/instructor/:path*",
        destination: "/dashboard/instructor",
      },
      {
        source: "/dashboard/student/:path*",
        destination: "/dashboard/student",
      },
    ];
  },
};

export default nextConfig;
