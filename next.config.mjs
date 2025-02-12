/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["demo.exa.ai"],
      allowedForwardedHosts: ["demo.exa.ai"],
    },
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;