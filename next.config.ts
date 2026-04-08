import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || "http://fac.raontec.co.kr:28085";
    const loginApiUrl = process.env.INTERNAL_LOGIN_API_URL || "http://fac.raontec.co.kr:28086";

    return [
      {
        // 일반 API 서버
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        // 로그인/인증 서버
        source: "/login-api/:path*",
        destination: `${loginApiUrl}/api/:path*`, 
      },
    ];
  },
};

export default nextConfig;