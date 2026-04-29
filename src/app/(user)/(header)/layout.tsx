"use client";

import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
   // const [activeTab, setActiveTab] = useState("홈");

    let activeTab = "홈";
    if (pathname.includes("/notice")) activeTab = "공지사항";
    else if (pathname.includes("/report")) activeTab = "신고하기";

    return (
        <div className={`wrap ${pathname === "/" ? "main-wrap" : "sub-wrap"}`}>
            {/* 이 그룹에 속한 페이지들 상단에만 헤더가 나타납니다 */}
            <Header activeTab={activeTab} setActiveTab={() => {}} />

            <main className={pathname === "/notice" ? "sub_article sub_article_padding" : "main_article"}>
                {children}
            </main>
        </div>
    );
}