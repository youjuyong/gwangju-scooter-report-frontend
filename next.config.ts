import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || "http://fac.raontec.co.kr:28085";
    const authUrl = "https://raonbackend.kr";

    return [
      {
        source: "/api-auth/:path*",
        destination: `${authUrl}/api-auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;