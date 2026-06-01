'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
    // 현재 로그인한 사용자의 권한 (예: admin, pm, tow 등)
    userRole?: string;
}

export default function AdminHeader({ userRole = 'admin' }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();

    // 실시간 시계 상태 관리
    const [currentTime, setCurrentTime] = useState('2026년 6월 1일 18:12');

    // 실시간 시계 업데이트 로직
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const date = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            setCurrentTime(`${year}년 ${month}월 ${date}일 ${hours}:${minutes}`);
        };

        updateTime();
        const timeInterval = setInterval(updateTime, 60000); // 1분마다 업데이트

        return () => clearInterval(timeInterval);
    }, []);

    // 로그아웃 처리
    const handleLogout = () => {
        alert('로그아웃 되었습니다.');
        router.push(`/${userRole}/login`);
    };

    // 메뉴 데이터 정의
    const menuItems = [
        { id: 'dashboard', classNum: 'menu1', name: '대시보드', path: `/${userRole}/dashboard` },
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
                        const isActive = pathname.startsWith(item.path);

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