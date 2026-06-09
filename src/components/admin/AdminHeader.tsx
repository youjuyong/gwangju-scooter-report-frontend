'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {authApi} from "@/services/api";
import {deleteCookie} from "cookies-next";
import axios from "axios";
import {toast} from "react-hot-toast";
import {useAlert} from "@/components/popup/PopupProvider";
import {useFcmToken} from "@/hooks/useFcmToken";
import {useAuthStore} from "@/store/authStore";
import {useAlarmStore} from "@/store/alamStore";

interface HeaderProps {
    // 현재 로그인한 사용자의 권한 (예: admin, pm, tow 등)
    userRole?: string;
}

export default function AdminHeader({ userRole = 'admin' }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const showAlert = useAlert();
    const { getDeviceInfo } = useFcmToken();
    const deviceType = getDeviceInfo();
    const getAuthType = () => {
        if (pathname.startsWith("/admin")) return "admin";
        if (pathname.startsWith("/pm")) return "pm";
        if (pathname.startsWith("/tow")) return "tow";
        return "reporter";
    };
    const authType = getAuthType();
    const state = useAuthStore();
    const clearStore = useAlarmStore((state) => state.clearStore);
    const prefix = authType === "reporter" ? "" : `/${authType}`;

    // 실시간 시계 상태 관리
    const [currentTime, setCurrentTime] = useState('2026년 6월 1일 18:12');

    // 실시간 시계 업데이트 로직
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1);
            const date = String(now.getDate());
            const hours = String(now.getHours());
            const minutes = String(now.getMinutes());

            setCurrentTime(`${year}년 ${month}월 ${date}일 ${hours}:${minutes}`);
        };

        updateTime();
        const timeInterval = setInterval(updateTime, 60000); // 1분마다 업데이트

        return () => clearInterval(timeInterval);
    }, []);

    // 로그아웃 처리
    const handleLogout = async () => {
        //if (!await showAlert("로그아웃 하시겠습니까?")) return;
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

    // 메뉴 데이터 정의
    const menuItems = [
        { id: 'dashboard', classNum: 'menu1', name: '대시보드', path: `/${userRole}` },
        { id: 'report', classNum: 'menu2', name: '이력/통계', path: `/${userRole}/report` },
        { id: 'notice', classNum: 'menu3', name: '정책관리', path: `/${userRole}/notice` },
        { id: 'pm', classNum: 'menu4', name: '시스템관리', path: `/${userRole}/pm` },
        { id: 'member', classNum: 'menu5', name: '사용자관리', path: `/${userRole}/member` },
    ];

    return (
        <header>
            <h1>방치킥보드관리시스템</h1>
            <nav>
                <ul>
                    {menuItems.map((item) => {
                        // 현재 페이지 주소가 메뉴 경로로 시작하면 'click' 클래스 추가
                        const isActive = item.id === 'dashboard'
                            ? pathname === item.path
                            : pathname.startsWith(item.path);

                        return (
                            <li
                                key={item.id}
                                className={`menu ${item.classNum} ${isActive ? 'click' : ''}`.trim()}
                            >
                                <Link href={item.path}>
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="header_Right">
                <p className="today">{currentTime}</p>
                <button className="btnLogout" onClick={handleLogout}>
                    로그아웃
                </button>
            </div>
        </header>
    );
}