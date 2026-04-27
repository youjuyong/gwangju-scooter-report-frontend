import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import "../css/base_style.css"; // 경로에 맞춰 임포트
import "../css/style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// src/app/layout.tsx
export const metadata: Metadata = {
  title: "PM 신고 시스템",
  description: "공유 킥보드 관리 및 신고 시스템",
  manifest: "/manifest.json",
  icons: {
    apple: "/push-icon.png",
  },
  appleWebApp: {
    capable: true, 
    statusBarStyle: "default", 
    title: "PM 신고 시스템",
  },
  formatDetection: {
    telephone: false, // 전화번호 자동 링크 방지 (필요 시)
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* iOS 전용 전체화면 설정 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* 안드로이드 전용 전체화면 설정 */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* 상태바 스타일 (default, black, black-translucent) */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster />
        {children}
      </body>
    </html>
  );
}
