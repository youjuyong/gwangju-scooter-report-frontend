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
        let sse: EventSourcePolyfill | null = null;
        let reconnectTimer: NodeJS.Timeout | null = null;
        let retryCount = 0;
        let closedByUser = false; // 사용자가 페이지를 이탈하거나 언마운트할 때 체크용
        const MAX_RETRY_COUNT = 5; // 최대 재연결 시도 횟수

        const connectSSE = () => {
            const token = accessToken;
            console.log("SSE 연결 시도...", `(시도 횟수: ${retryCount})`);

            if (!token) return;

            if (sse) {
                sse.close();
            }
            
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }

            try {
                sse = new EventSourcePolyfill(`${process.env.NEXT_PUBLIC_API_URL}/sse/connect`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    heartbeatTimeout: 60000
                });
            } catch (e) {
                console.log("서버 객체 생성 실패:", e);
                handleReconnect();
                return;
            }

            /** 연결 성공 */
            sse.onopen = () => {
                console.log("SSE 연결 완료");
                retryCount = 0;
                closedByUser = false; 
            };

            /** 서버 이벤트 */
            sse.addEventListener("PING", (e: any) => {
                console.log("SSE 연결 지속... (PING)");
            });

            /** 에러 발생 및 연결 끊김 처리 */
            sse.onerror = (err: any) => {
                console.error("### [SSE] 에러 발생 혹은 연결 끊김:", err);
    
                if (sse && sse.readyState === 2) {
                    console.log("[SSE] 연결이 완전히 종료 상태(CLOSED)로 전환되었습니다.");
                    sse.close();
                    sse = null;
                }

                 const statusCode = err?.status || err?.target?.status || err?.error?.status;
                console.log(`[SSE] 감지된 HTTP 상태 코드: ${statusCode}`);

                if (statusCode === 401 || statusCode === 403) {
                    if (sse) {
                        sse.close();
                        sse = null;
                    }
                    return;
                }

                if (statusCode === 502 || statusCode === 504) {
                    console.warn("### [SSE] 502/504 에러 감지 (인프라/웹서버 일시적 순시 끊김). 잠시 후 재연결을 시도합니다.");
                }

                if (!closedByUser) {
                    console.log("[SSE] 사용자에 의한 종료가 아니므로 재연결 프로세스(handleReconnect)를 가동합니다.");
                    
                    if (sse) {
                        sse.close();
                        sse = null;
                    }
                    
                    handleReconnect();
                }
            };
        };

        /** 재연결 스케줄러 */
        const handleReconnect = () => {
            if (retryCount >= MAX_RETRY_COUNT) {
                console.log(`최대 재연결 시도 횟수(${MAX_RETRY_COUNT}회)를 초과했습니다. 재연결을 중단합니다.`);
                return;
            }

            retryCount++;
            const delay = Math.min(2000 * Math.pow(2, retryCount - 1), 30000); 

            console.log(`${delay / 1000}초 후에 재연결을 시도합니다...`);

            reconnectTimer = setTimeout(() => {
                connectSSE();
            }, delay);
        };

        connectSSE();

        return () => {
            console.log("SSE 연결을 사용자에 의해 종료합니다.");
            closedByUser = true;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            if (sse) {
                sse.close();
                sse = null;
            }
        };
    }, [accessToken]);

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
