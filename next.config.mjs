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
    // Add image optimization
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-faf2d56f350a464f917b1de058fed3ef.r2.dev",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "antd",
      "@ant-design/icons",
    ],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
};

export default nextConfig;
