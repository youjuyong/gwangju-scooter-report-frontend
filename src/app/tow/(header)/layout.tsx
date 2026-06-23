"use client";

import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import React, {useState, useEffect, useSyncExternalStore} from "react";
import {useAlarmStore} from "@/store/alamStore";
import {useAuthStore} from "@/store/authStore";
import {getAlarmListApi} from "@/services/alarm/alarmApi";
import {useSseStore} from "@/store/sseStore";
// 가짜 구독 함수 (클라이언트 로딩 체크용)
const emptySubscribe = () => () => {};

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const accessToken = useAuthStore((state) => state.tow?.accessToken);
    const test = useAuthStore((state) => state);
    const alarmList = useSseStore((state) => state.alarmList);
    const setInitialList = useSseStore((state) => state.setInitialList);
    const connectSSE = useSseStore((state) => state.connectSSE);
    const alarmLength = alarmList.length;

    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/reportList")) activeTab = "회수관리";
    else if (pathname.includes("/report")) activeTab = "신고하기";

    // 로그인시 알람 리스트 삽입
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

    // 컴포넌트가 브라우저에 완전히 마운트된 후에만 화면을 보여줌
    const isClient = useSyncExternalStore(
        emptySubscribe,
        () => true,  // 클라이언트(브라우저)일 때 값
        () => false  // 서버일 때 값
    );
    if (!isClient) {
        return <div className="loading-screen"></div>; // 또는 빈 화면
    }

    return (
        <div className={`wrap ${pathname === "/" ? "main-wrap" : "sub-wrap"}`}>
            {/* 이 그룹에 속한 페이지들 상단에만 헤더가 나타납니다 */}
            <Header activeTab={activeTab} setActiveTab={() => {}}/>

            <main className={pathname === "/tow" ? "main_article" : "sub_article sub_article_padding"}>
                {children}
            </main>
        </div>
    );
}