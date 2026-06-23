"use client";

import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import React, { useEffect, useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/authStore";
import { getAlarmListApi } from "@/services/alarm/alarmApi";
import { useSseStore } from "@/store/sseStore";

// 클라이언트 사이드 렌더링 체크용 빈 구독 함수
const emptySubscribe = () => () => {};

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // 1. 전역 인증 및 알림(SSE) 상태 추출
    const accessToken = useAuthStore((state) => state.pm?.accessToken);
    const alarmList = useSseStore((state) => state.alarmList);
    const setInitialList = useSseStore((state) => state.setInitialList);
    const connectSSE = useSseStore((state) => state.connectSSE);
    const alarmLength = alarmList.length;

    // 2. 현재 경로에 따른 활성화 탭 매핑
    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/reportList")) activeTab = "회수관리";
    else if (pathname.includes("/report")) activeTab = "신고하기";

    useEffect(() => {
        if (!accessToken || alarmLength !== 0) return;

        const fetchAlarms = async () => {
            try {
                const data = await getAlarmListApi();
                setInitialList(data);
            } catch (error) {
                console.error("알림 리스트 초기화 실패:", error);
            }
        };
        fetchAlarms();
    }, [setInitialList, alarmLength, accessToken]);

    useEffect(() => {
        if (accessToken) {
            connectSSE(accessToken);

            const handleBeforeUnload = () => {
                useSseStore.getState().disconnectSSE();
            };

            window.addEventListener('beforeunload', handleBeforeUnload);
            
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                useSseStore.getState().disconnectSSE();
            };
        }
    }, [accessToken, connectSSE]);



    const isClient = useSyncExternalStore(
        emptySubscribe,
        () => true, 
        () => false 
    );

    if (!isClient) {
        return <div className="loading-screen"></div>;
    }

    return (
        <div className={`wrap ${pathname === "/pm" ? "main-wrap" : "sub-wrap"}`}>
            <Header activeTab={activeTab} setActiveTab={() => {}} />

            <main className={pathname === "/pm" ? "main_article" : "sub_article sub_article_padding"}>
                {children}
            </main>
        </div>
    );
}