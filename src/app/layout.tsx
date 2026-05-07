import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {Toaster} from 'react-hot-toast';
import BFCacheHandler from "@/components/auth/BFCacheHandler";
import FocusVisibleProvider from "@/components/FocusVisibleProvider";
import React from "react";
import Script from "next/script";

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
    title: "경기도광주시 공유 킥보드 신고 시스템",
    description: "경기도 광주시에서 공유 킥보드를 신고 할수 있는 시스템입니다.",
    manifest: "/manifest.json",
    icons: {
        apple: "/push-icon.png",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "경기도광주시 공유 킥보드 신고 시스템",
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
            <meta name="apple-mobile-web-app-capable" content="yes"/>
            {/* 안드로이드 전용 전체화면 설정 */}
            <meta name="mobile-web-app-capable" content="yes"/>
            {/* 상태바 스타일 (default, black, black-translucent) */}
            <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
            <Script
                src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&libraries=services&autoload=false`}
                strategy="beforeInteractive"
            />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <BFCacheHandler/>
        <Toaster/>
        <FocusVisibleProvider>
            {children}
        </FocusVisibleProvider>
        </body>
        </html>
    );
}
