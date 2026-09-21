import type { NextConfig } from "next";

// 카카오맵 SDK(dapi.kakao.com)가 지도 타일/이미지/XHR을 daumcdn.net, kakao.com 하위 도메인에서
// 불러오고, firebase-messaging-sw.js가 gstatic.com에서 firebase 스크립트를 importScripts로
// 불러오며, FCM 토큰 발급/설치가 googleapis.com에 붙기 때문에 이 도메인들을 허용해야 한다.
// script-src에 'unsafe-inline'이 필요한 이유는 Next.js App Router의 스트리밍(RSC) 데이터 주입이
// 인라인 <script>를 쓰기 때문(nonce로 바꾸려면 전 페이지를 동적 렌더링으로 돌려야 해서 별도 작업).
const buildCsp = () => {
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' *.kakao.com *.daumcdn.net https://www.gstatic.com https://*.jsdelivr.net${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: *.daumcdn.net *.kakao.com",
    "font-src 'self' data:",
    "connect-src 'self' *.daumcdn.net *.kakao.com https://*.googleapis.com https://*.jsdelivr.net",
    "media-src 'self' data:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
};

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp() },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL || "https://raonbackend.kr:28085/";
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