// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import BFCacheHandler from "@/components/auth/BFCacheHandler";
import FocusVisibleProvider from "@/components/FocusVisibleProvider";
import React from "react";
import Script from "next/script";
import { PopupProvider } from "@/components/popup/PopupProvider";
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


const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
};

// 2. 동적으로 메타데이터를 생성하는 함수
export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const pathname = headersList.get("x-current-path") || "";
    
    const baseUrl = getBaseUrl();
    
    let title = "경기도광주시 공유 킥보드 신고 시스템";
    let description = "경기도 광주시에서 불법 주차된 공유 킥보드를 신속하게 신고하세요.";
    

    if (pathname.includes("/admin")) {
        title = "운영자 관리 시스템 - 경기도광주시 공유 킥보드";
        description = "경기도 광주시 공유 킥보드 관리자 전용 시스템입니다.";
    } else if (pathname.includes("/pm")) {
        title = "PM사 관리 시스템 - 경기도광주시 공유 킥보드";
        description = "공유 킥보드 PM사 전용 관리 시스템입니다.";
    } else if (pathname.includes("/tow")) {
        title = "견인사 관리 시스템 - 경기도광주시 공유 킥보드";
        description = "불법 주차 킥보드 견인 대행사 전용 시스템입니다.";
    }

    return {
        metadataBase: new URL(baseUrl),
        title,
        description,
        manifest: "/manifest.json",
        icons: {
            apple: "/push-icon.png",
        },
        appleWebApp: {
            capable: true,
            statusBarStyle: "default",
            title,
        },
        formatDetection: {
            telephone: false,
        },
        openGraph: {
            title,
            description,
            siteName: "경기도광주시 공유 킥보드 신고 시스템",
            images: [
                {
                    url: "/og-image_v2.png",
                    width: 1200,
                    height: 630,
                    alt: "경기도광주시 캐릭터",
                },
            ],
            locale: "ko_KR",
            type: "website",
        },
    };
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const pathname = headersList.get("x-current-path") || "";

    const isAdmin = pathname.includes("/admin");
    const bodyClass = isAdmin ? "systembody" : "";

    return (
        <html lang="ko">
        <head>
            <meta name="apple-mobile-web-app-capable" content="yes"/>
            <meta name="mobile-web-app-capable" content="yes"/>
            <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
            <Script
                src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&libraries=services&autoload=false`}
                strategy="beforeInteractive"
            />
        </head>
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