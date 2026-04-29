"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFcmToken } from "@/hooks/useFcmToken";
import { authApi } from "@/services/api";
import { toast } from "react-hot-toast";
import axios from "axios";

// 1. 이제 setActiveTab은 필요 없습니다. URL이 상태가 되기 때문입니다.
interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
    const router = useRouter();
    const { getDeviceInfo } = useFcmToken();
    const deviceType = getDeviceInfo();

    const [showLoginPopup, setShowLoginPopup] = useState(false);

    const accessToken = useAuthStore((state) => state.accessToken);
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setRole = useAuthStore((state) => state.setRole);
    const userName = useAuthStore((state) => state.userName);

    const handleLogout = async () => {
        if (!confirm("로그아웃 하시겠습니까?")) return;
        try {
            await authApi.post("/logout", { deviceType });
            setAccessToken(null);
            setRole(null);
            delete axios.defaults.headers.common["Authorization"];
            toast.success("로그아웃되었습니다.");
            router.replace("/");
        } catch (error) {
            console.error("로그아웃 실패:", error);
            alert("로그아웃 중 오류가 발생했습니다.");
        }
    };

    // 2. 권한 체크 및 '페이지 이동' 처리
    const handleNavigation = (e: React.MouseEvent, path: string, isProtected: boolean) => {
        e.preventDefault();

        if (isProtected && !accessToken) {
            setShowLoginPopup(true);
        } else {
            // 주소창을 변경하여 실제 페이지로 이동시킵니다.
            router.push(path);
        }
    };

    return (
        <>
            <div className="popupbox" style={{ display: showLoginPopup ? "block" : "none" }}>
                <div className="popupconten">
                    <p className="popuptxt">로그인 후 이용하세요</p>
                    <div className="popupbtnset">
                        <button onClick={() => setShowLoginPopup(false)}>확인</button>
                    </div>
                </div>
                <div className="popbg"></div>
            </div>

            <header>
                <h1>
                    <img
                        src="/images/simbol_s.png"
                        alt="킥보드주정차위반신고"
                        onClick={() => router.push("/")}
                        style={{ cursor: 'pointer' }}
                    />
                </h1>

                {accessToken ? (
                    <p className="login-msg">
                        {userName}님 반갑습니다! <span onClick={handleLogout} style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px', fontSize: '12px' }}>임시 로그아웃</span>
                    </p>
                ) : (
                    <p className="login-msg" onClick={() => router.push("/commLogin")} style={{ cursor: 'pointer' }}>
                        로그인 해주세요.
                    </p>
                )}

                <div className="header_right">
                    <a href="#" className="btnalarm" onClick={(e) => handleNavigation(e, "/alarm", true)}>알림</a>
                    <a href="#" className="btnset" onClick={(e) => handleNavigation(e, "/set", true)}>환경설정</a>
                </div>

                <nav>
                    <ul>
                        <li className={activeTab === "홈" ? "click" : ""}>
                            <a href="#" className="menuHome" onClick={(e) => handleNavigation(e, "/", false)}>
                                홈
                            </a>
                        </li>
                        <li className={activeTab === "신고확인" ? "click" : ""}>
                            <a href="#" className="menuReport" onClick={(e) => handleNavigation(e, "/report-list", true)}>
                                신고확인
                            </a>
                        </li>
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