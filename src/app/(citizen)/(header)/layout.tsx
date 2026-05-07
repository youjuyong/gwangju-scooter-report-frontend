"use client";

import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import React, {useState, useEffect, useSyncExternalStore} from "react";
// 가짜 구독 함수 (클라이언트 로딩 체크용)
const emptySubscribe = () => () => {};

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
   // const [activeTab, setActiveTab] = useState("홈");

    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/reportList")) activeTab = "신고확인";

    // 컴포넌트가 브라우저에 완전히 마운트된 후에만 화면을 보여줌
    const isClient = useSyncExternalStore(
        emptySubscribe,
        () => true,  // 클라이언트(브라우저)일 때 값
        () => false  // 서버일 때 값
    );
    if (!isClient) {
        return <div className="loading-screen"></div>; // 또는 빈 화면
    }

    const isSubPage = pathname.startsWith("/notice") || pathname.startsWith("/reportList");

    return (
        <div className={`wrap ${pathname === "/" ? "main-wrap" : "sub-wrap"}`}>
            {/* 이 그룹에 속한 페이지들 상단에만 헤더가 나타납니다 */}
            <Header activeTab={activeTab} setActiveTab={() => {}} />

            <main className={isSubPage ? "sub_article sub_article_padding" : "main_article"}>
                {children}
            </main>
        </div>
    );
}