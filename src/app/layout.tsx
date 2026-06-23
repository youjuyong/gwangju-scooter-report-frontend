import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {Toaster} from 'react-hot-toast';
import BFCacheHandler from "@/components/auth/BFCacheHandler";
import FocusVisibleProvider from "@/components/FocusVisibleProvider";
import React from "react";
import Script from "next/script";
import {PopupProvider} from "@/components/popup/PopupProvider";
import { headers } from "next/headers";
import Providers from "@/components/providers";

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
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : "http://localhost:3000"
    ),
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
    openGraph: {
        title: "경기도광주시 공유 킥보드 신고 시스템",
        description: "경기도 광주시에서 불법 주차된 공유 킥보드를 신속하게 신고하세요.",
        siteName: "경기도광주시 공유 킥보드 신고 시스템",
        images: [
            {
                url: "/og-image.png", 
                width: 1200,
                height: 630,
                alt: "경기도광주시 캐릭터",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
};

export default async function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    // 서버에서 현재 요청된 URL 경로(pathname)를 추출합니다.
     const headersList = await headers();
    const pathname = headersList.get("x-current-path") || "";

    // 주소창에 /admin 이 포함되어 있는지 검사하여 클래스명을 결정합니다.
    const isAdmin = pathname.includes("/admin");
    const bodyClass = isAdmin ? "systembody" : "";

    return (
        <html lang="ko">
        <head>
            {/* iOS 전용 전체화면 설정 */}
            <meta name="apple-mobile-web-app-capable" content="yes"/>
            {/* 안드로이드 전용 전체화면 설정 */}
            <meta name="mobile-web-app-capable" content="yes"/>
            {/* 상태바 스타일 */}
            <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
            {/* 화면 비율 및 확대 축소 제어  */}
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
            <Script
                src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&libraries=services&autoload=false`}
                strategy="beforeInteractive"
            />
        </head>
        {/*  조건에 맞춰 기존 폰트 클래스 뒤에 systembody가 깔끔하게 붙도록 결합했습니다. */}
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${bodyClass}`.trim()}>
        <BFCacheHandler/>
        <Toaster/>
        <Providers>
            <FocusVisibleProvider>
                <PopupProvider>
                    {children}
                </PopupProvider>
            </FocusVisibleProvider>
        </Providers>
        </body>
        </html>
    );
}
