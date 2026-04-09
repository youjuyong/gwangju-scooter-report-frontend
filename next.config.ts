import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || "http://fac.raontec.co.kr:28085";
    const authUrl = process.env.NEXT_PUBLIC_LOGIN_API_URL || "https://raonbackend.kr"; 

    return [
      // 1. 인증 관련 API
      {
        source: "/api/auth/:path*",
        destination: `${authUrl}/api/auth/:path*`,
      },
      // 2. 그 외 모든 /api 요청
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;