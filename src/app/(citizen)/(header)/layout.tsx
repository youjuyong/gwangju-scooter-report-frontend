"use client";

import Header from "@/components/Header";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useSyncExternalStore } from "react";

// 가짜 구독 함수 (클라이언트 로딩 체크용)
const emptySubscribe = () => () => {};

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    console.log(router);
    console.log(pathname);
    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/reportList")) activeTab = "신고확인";

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'NAVIGATE') {
                    const targetUrl = event.data.url;
                    console.log("targetUrl 경로 : ", targetUrl);
                    
                    if (targetUrl.startsWith('/reportList') || targetUrl.startsWith('/citizen')) {
                        window.location.href = targetUrl; 
                    }
                }
            };

            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, [router]);

    const isClient = useSyncExternalStore(
        emptySubscribe,
        () => true,  
        () => false 
    );

    if (!isClient) {
        return <div className="loading-screen"></div>; 
    }

    const isSubPage = pathname.startsWith("/notice") || pathname.startsWith("/reportList");

    return (
        <div className={`wrap ${pathname === "/" ? "main-wrap" : "sub-wrap"}`}>
            <Header activeTab={activeTab} setActiveTab={() => {}} />

            <main className={isSubPage ? "sub_article sub_article_padding" : "main_article"}>
                {children}
            </main>
        </div>
    );
}