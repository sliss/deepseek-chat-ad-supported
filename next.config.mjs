/** @type {import('next').NextConfig} */

const nextConfig = {
  basePath: "/deepseekchat",
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