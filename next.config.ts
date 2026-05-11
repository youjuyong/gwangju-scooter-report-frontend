import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL || "https://raonbackend.kr:28085";
    const authUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || "https://raonbackend.kr";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/api-auth/:path*",
        destination: `${authUrl}/api-auth/:path*`,
      },
    ];
  },
};

export default nextConfig;