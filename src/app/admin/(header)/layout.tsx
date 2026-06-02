"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import "../../../assets/style_admin/css/base_style.css";
import "../../../assets/style_admin/css/style.css";

const emptySubscribe = () => () => {};

export default function AdminHeaderLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const userRole = "admin";

    // Service Worker 통신 로직 유지
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'NAVIGATE') {
                    const targetUrl = event.data.url;
                    if (targetUrl.startsWith(`/${userRole}`)) {
                        window.location.href = targetUrl;
                    }
                }
            };
            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
        }
    }, [router]);

    // 하이드레이션(SSR-클라이언트 싱크) 방어
    const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

    if (!isClient) {
        return <div className="loading-screen"></div>;
    }

    // 💡 주소에 맞는 동적 wrap 클래스명 설정
    // 이력/통계인 (static) 하위 페이지로 들어오면 HTML과 똑같이 'report_wrap'을 붙여줍니다.
    let wrapClass = " ";
    if (pathname.includes("/report") ) {
        wrapClass = "report_wrap";
    }

    return (
  <div>
        {/* 1. HTML 상단의 공통 헤더 컴포넌트 배치 */}
    <AdminHeader userRole={userRole}/>
    <div className={`wrap ${wrapClass}`}>
        {/* 2. 하위 페이지 내용(subnav, searchBox, gridbox 등)이 들어오는 구역 */}
        {/* HTML 구조상 wrap 바로 밑에 subnav와 subarticle이 나란히 배치되므로 그대로 뚫어줍니다 */}
        {children}
    </div>
  </div>
)
    ;
}