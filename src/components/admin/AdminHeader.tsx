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

    //  디렉토리 구조 기반 대메뉴 및 기본 이동(이정표) 경로 정의
    const menuItems = [
        { id: 'dashboard', classNum: 'menu1', name: '대시보드', path: `/${userRole}` },
        { id: 'static', classNum: 'menu2', name: '이력/통계', path: `/${userRole}/report` }, // 하위 폴더 personal 구조 반영
        { id: 'policy', classNum: 'menu3', name: '정책관리', path: `/${userRole}/notice` },   // 하위 폴더 notice 구조 반영
        { id: 'system', classNum: 'menu4', name: '시스템관리', path: `/${userRole}/pm` },      // 하위 폴더 pm 구조 반영
        { id: 'user', classNum: 'menu5', name: '사용자관리', path: `/${userRole}/member` },   // 하위 폴더 manager 구조 반영
    ];

    //  URL 경로에서 핵심 카테고리 세그먼트 추출
    // 예: "/admin/personal" -> "personal", "/admin/statistic_menu01" -> "statistic_menu01"
    const currentCategory = pathname.split('/')[2] || 'dashboard';

    return (
        <header>
            <h1>방치킥보드관리시스템</h1>
            <nav>
                <ul>
                    {menuItems.map((item) => {
                        let isActive = false;

                        // 💡 3. 실제 폴더 구조 트리와 주소 세그먼트 그룹 매핑 매칭
                        if (item.id === 'dashboard') {
                            isActive = currentCategory === 'dashboard' || pathname === `/${userRole}`;
                        }
                        else if (item.id === 'static') {
                            // (static) 그룹에 포함된 실제 하위 라우트 폴더명들 전부 매핑
                            isActive = [
                                'personal', 'report',
                                'statistic01', 'statistic02', 'statistic03',
                                'statistic_menu01', 'statistic_menu02', 'statistic_menu03'
                            ].includes(currentCategory);
                        }
                        else if (item.id === 'policy') {
                            // (policy) 그룹 하위 폴더명 매핑
                            isActive = ['notice', 'policy'].includes(currentCategory);
                        }
                        else if (item.id === 'system') {
                            // (system) 그룹 하위 폴더명 매핑
                            isActive = ['pm', 'point', 'seting'].includes(currentCategory);
                        }
                        else if (item.id === 'user') {
                            // (user) 그룹 하위 폴더명 매핑
                            isActive = ['manager', 'member'].includes(currentCategory);
                        }

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