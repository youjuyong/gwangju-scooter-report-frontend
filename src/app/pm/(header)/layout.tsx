"use client";

import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import React, {useState, useEffect, useSyncExternalStore} from "react";
import {useAuthStore} from "@/store/authStore";
import {getAlarmListApi} from "@/services/alarm/alarmApi";
import {useAlarmStore} from "@/store/alamStore";
// 가짜 구독 함수 (클라이언트 로딩 체크용)
const emptySubscribe = () => () => {};

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const alarmList = useAlarmStore((state) => state.alarmList);
    const setInitialList = useAlarmStore((state) => state.setInitialList);
    const token = useAuthStore((state) => state.pm?.accessToken);
    const alarmLength = alarmList.length;

    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/reportList")) activeTab = "회수관리";
    else if (pathname.includes("/report")) activeTab = "신고하기";

    // 로그인시 알람 리스트 삽입
    useEffect(() => {
        // 토큰이 없거나, 이미 알림이 있다면 아무것도 하지 않고 즉시 종료
        if (!token || alarmLength !== 0) return;

        const fetchAlarms = async () => {
            try {
                const data = await getAlarmListApi();
                setInitialList(data);
            } catch (error) {
                console.error("알림 리스트 초기화 실패:", error);
            }
        };
        fetchAlarms();
    }, [setInitialList, alarmLength, token]);

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
        <div className={`wrap ${pathname === "/pm" ? "main-wrap" : "sub-wrap"}`}>
            {/* 이 그룹에 속한 페이지들 상단에만 헤더가 나타납니다 */}
            <Header activeTab={activeTab} setActiveTab={() => {}} />

            <main className={pathname === "/pm" ?  "main_article" :"sub_article sub_article_padding"}>
                {children}
            </main>
        </div>
    );
}