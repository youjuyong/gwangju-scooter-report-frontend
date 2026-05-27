"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFcmToken } from "@/hooks/useFcmToken";
import { authApi } from "@/services/api";
import { toast } from "react-hot-toast";
import axios from "axios";
import {deleteCookie, setCookie} from "cookies-next";
import {getAlarmListApi} from "@/services/alarm/alarmApi";
import Popup from "@/components/popup/Popup";
import {useAlert} from "@/components/popup/PopupProvider";
import {AlarmResponse} from "@/types/alarm";
import { useAlarmStore } from '@/store/alamStore';

interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const { getDeviceInfo } = useFcmToken();
    const deviceType = getDeviceInfo();
    // 1. 현재 경로 분석 (admin, pm, tow, reporter)
    const getAuthType = () => {
        if (pathname.startsWith("/admin")) return "admin";
        if (pathname.startsWith("/pm")) return "pm";
        if (pathname.startsWith("/tow")) return "tow";
        return "reporter";
    };
    const authType = getAuthType();

    const prefix = authType === "reporter" ? "" : `/${authType}`;
    const [isMounted, setIsMounted] = useState(false);

    // 2. Zustand 스토어에서 현재 권한에 맞는 상태와 액션 가져오기
    const state = useAuthStore();
    const currentAuth = useAuthStore((state) => state[authType]);
    const logout = useAuthStore((state) => state.logout);
    const accessToken = useAuthStore((state) => state[authType].accessToken);
    const showAlert = useAlert();
    const alarmList = useAlarmStore((state) => state.alarmList);
    const clearStore = useAlarmStore((state) => state.clearStore);
    const hasNewAlarm =  alarmList.some((alarm) => alarm.readYn === 'N');



    // 3. Hydration 대기 (클라이언트에서 스토리지 데이터를 다 읽었는지 확인)
    useEffect(() => {
        setCookie(`${authType}AccessToken`, accessToken, {
            maxAge: 60 * 60 * 24,
            path: '/', // 전체 경로에서 접근 가능하도록 설정 권장
        });
        setIsMounted(true);
    }, []);

    // 2. 권한 체크 및 '페이지 이동' 처리
    const handleNavigation = (e: React.MouseEvent, path: string, isProtected: boolean) => {
        e.preventDefault();


        const targetPath = path === "/" ? (prefix || "/") : `${prefix}${path}`;

        if (isProtected && !currentAuth.accessToken) {
            setShowLoginPopup(true);
        } else {
            router.push(targetPath);
        }
    };
    const handleLogout = async () => {
        if (!await showAlert("로그아웃 하시겠습니까?")) return;
        try {

            // 백엔드에 로그아웃 알림 (기기 정보 전달)
            await authApi.post("/logout", { deviceType });

            // 클라이언트 상태 및 쿠키 삭제
            state.logout(authType);

            deleteCookie(`${authType}AccessToken`);

            delete axios.defaults.headers.common["Authorization"];
            clearStore(); // 헤더 알림 리스트 삭제
            toast.success("로그아웃되었습니다.");

            // 로그아웃 후 해당 서비스의 로그인 페이지 또는 메인으로 이동
            if (prefix) {
                router.push(`${prefix}/login`);
            } else {
                router.push("/");
            }

        } catch (error) {
            console.error("로그아웃 실패:", error);
            toast.error("로그아웃 중 오류가 발생했습니다.");
        }
    };

    return (
        <>
            <Popup
                isOpen={showLoginPopup}
                onClose={() => setShowLoginPopup(false)}
            />

            <header>
                <h1>
                    <img
                        src="/assets/style/images/simbol_s.png"
                        alt="킥보드주정차위반신고"
                        onClick={() => router.push(prefix || "/")}
                        style={{ cursor: 'pointer' }}
                    />{prefix && " 방치 킥보드 회수 시스템"}
                </h1>
                {!prefix && (
                    currentAuth.accessToken ? (
                        <p className="login-msg">{currentAuth.userInfo?.name}님 반갑습니다!</p>
                    ) : (
                        <p className="login-msg"  >
                            로그인 해주세요.
                        </p>
                    )
                )}

                <div className="header_right">
                    {hasNewAlarm ? (<a href="alarm.html" className="btnalarm"  onClick={(e) => handleNavigation(e, "/alarm", true)}><span className="new">읽지 않은 알림 있음</span>알림</a>)
                        :   ( <a href="#" className="btnalarm" onClick={(e) => handleNavigation(e, "/alarm", true)}>알림</a>)
                    }
                    {prefix ? (
                        <a href="#" className="btnlogout" onClick={handleLogout}>로그아웃</a>
                    ) : (
                        <a href="#" className="btnset" onClick={(e) => handleNavigation(e, "/set", true)}>환경설정</a>
                    )}
                </div>

                <nav>
                    <ul>
                        <li className={activeTab === "홈" ? "click" : ""}>
                            <a href="#" className="menuHome" onClick={(e) => handleNavigation(e, "/", false)}>
                                홈
                            </a>
                        </li>
                        {prefix == "" ?
                            (<li className={activeTab === "신고확인" ? "click" : ""}>
                            <a href="#" className="menuReport" onClick={(e) => handleNavigation(e, "/reportList", true)}>
                                신고확인
                            </a>
                        </li>)
                            : (<li className={activeTab === "회수관리" ? "click" : ""}>
                                    <a href="#" className="menuReport"
                                       onClick={(e) => handleNavigation(e, "/reportList", true)}>
                                        회수관리
                                    </a>
                                </li>)
                        }
                        <li className={activeTab === "공지사항" ? "click" : ""}>
                            <a href="#" className="menuBoard" onClick={(e) => handleNavigation(e, "/notice", false)}>
                            공지사항
                            </a>
                        </li>
                    </ul>
                </nav>
            </header>
        </>
    );
}