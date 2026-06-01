"use client";

import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import React, {useState, useEffect, useSyncExternalStore} from "react";
import {useAuthStore} from "@/store/authStore";
import {getAlarmListApi} from "@/services/alarm/alarmApi";
import {useAlarmStore} from "@/store/alamStore";
import {EventSourcePolyfill} from "event-source-polyfill";

// 가짜 구독 함수 (클라이언트 로딩 체크용)
const emptySubscribe = () => () => {};

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const alarmList = useAlarmStore((state) => state.alarmList);
    const setInitialList = useAlarmStore((state) => state.setInitialList);
    const accessToken = useAuthStore((state) => state.pm?.accessToken);
    const alarmLength = alarmList.length;

    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/reportList")) activeTab = "회수관리";
    else if (pathname.includes("/report")) activeTab = "신고하기";

    // 로그인시 알람 리스트 삽입
    useEffect(() => {
        // 토큰이 없거나, 이미 알림이 있다면 아무것도 하지 않고 즉시 종료
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
        let sse: EventSource | null = null;
        let reconnectTimer: NodeJS.Timeout | null = null;
        let closedByUser = false;
        let retryCount = 0;
        const MAX_RETRIES = 5;

        const connectSSE = () => {
            const token = accessToken;

            console.log(" SSE 연결 시도...");

            if (!token) return;

            // 기존 SSE가 살아있으면 종료
            if (sse) sse.close();
            try {
                sse = new EventSourcePolyfill(`${process.env.NEXT_PUBLIC_API_URL}/sse/connect`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    heartbeatTimeout: 60000
                });
            } catch (e) {
                console.log("서버 연결에 실패했습니다.");
                return;
            }

            /** 연결 성공 */
            sse.onopen = () => {
                 console.log("SSE 연결됨");
                retryCount = 0;
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
            };

            /** 서버 이벤트 */
            sse.addEventListener("PING", (e: any) => {
                const {sseResponse} = JSON.parse(e.data);
                 console.log("SSE 연결 지속...");
            });


            sse.onerror = async (err: any) => {
                console.log("on error");
                if (closedByUser) return;
                sse?.close();

                const status = err.status;
                console.log(status)
                // const token = store.getState().auth.accessToken;
                //
                // if (!token) {
                //     return;
                // }

                // if (err.status === 401 || err.status === 403) {
                //     if (isRefreshing) return;
                //
                //     isRefreshing = true;
                //     try {
                //         const { accessToken: newToken } = await refreshToken();
                //         store.dispatch(setAccessToken(newToken));
                //     } catch (refreshError) {
                //         handleSessionExpiry("로그인 정보가 만료되었습니다. 다시 로그인 해주세요.");
                //     } finally {
                //         isRefreshing = false;
                //     }
                //     return;
                // }

                if (status === undefined) {
                    // if (retryCount < MAX_RETRIES) {
                    //     retryCount++;
                    //     if (!reconnectTimer) {
                    //         reconnectTimer = setTimeout(() => {
                    //             reconnectTimer = null;
                    //             connectSSE();
                    //         }, 3000);
                    //     }
                    //     return;
                    // } else {
                    //     (window as any).isMaintenanceMode = true;
                    //
                    //     // if (window.location.pathname !== "/maintenance") {
                    //     //     setIsRedirecting(true);
                    //     //     window.location.replace("/maintenance");
                    //     //     return;
                    //     // }
                    // }
                } else {
               //     handleSessionExpiry("서버와의 연결이 끊어졌습니다. 다시 로그인해 주세요.");
                    console.log("else~~~~~~~~~~~~~~~~");
                }
            };
        };

        connectSSE();

        return () => {
            closedByUser = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            sse?.close();
        };
    }, [accessToken]);

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