"use client";

import Header from "@/components/Header";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import {getAlarmListApi} from "@/services/alarm/alarmApi";
import {useAlarmStore} from "@/store/alamStore";
import {useAuthStore} from "@/store/authStore";
import ReportList from "@/components/report/ReportList";


// 가짜 구독 함수 (클라이언트 로딩 체크용)
const emptySubscribe = () => () => {};

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const setInitialList = useAlarmStore((state) => state.setInitialList);
    const alarmList = useAlarmStore((state) => state.alarmList);
    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/reportList")) activeTab = "신고확인";

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'NAVIGATE') {
                    const targetUrl = event.data.url;
                    
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

    useEffect(() => {

        const token = useAuthStore.getState()['reporter'].accessToken;
        console.log(token)
        console.log(alarmList.length);
        if(token && alarmList.length ===0 ){
            const fetchAlarms = async () => {
                try {
                    const data = await getAlarmListApi();
                    setInitialList(data);
                } catch (error) {
                    console.error("알림 리스트 초기화 실패:", error);
                }
            };

            fetchAlarms();
        }
    }, [setInitialList, alarmList.length]);
    
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