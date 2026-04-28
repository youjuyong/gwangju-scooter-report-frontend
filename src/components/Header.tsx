"use client";

import React, {useState} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFcmToken } from "@/hooks/useFcmToken";
import { authApi } from "@/services/api";
import { toast } from "react-hot-toast";
import axios from "axios";

interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
    const router = useRouter();
    const { getDeviceInfo } = useFcmToken();
    const deviceType = getDeviceInfo();

    // 팝업 노출 상태 관리
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    // Auth 상태 가져오기
    const accessToken = useAuthStore((state) => state.accessToken);
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setRole = useAuthStore((state) => state.setRole);
    const userName = useAuthStore((state) => state.userName);


    // 로그아웃 핸들러
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

    // 이동 전 권한 체크 함수
    const handleProtectedAction = (e: React.MouseEvent, tabName: string) => {
        e.preventDefault(); // 기본 링크 이동 방지

        if (!accessToken) {
            // 1. 로그인 안 되어 있으면 팝업 띄우기
            setShowLoginPopup(true);
        } else {
            // 2. 로그인 되어 있으면 해당 탭으로 전환
            setActiveTab(tabName);
        }
    };

    return (
        <>
        {/* 팝업창 영역: showLoginPopup 상태에 따라 display 제어 */}
    <div className="popupbox" style={{ display: showLoginPopup ? "block" : "none" }}>
            <div className="popupconten">
                <p className="popuptxt">로그인 후 이용하세요</p>
                <div className="popupbtnset">
                    <button onClick={(e) => setShowLoginPopup(false)}>확인</button>
                </div>
            </div>
            <div className="popbg"></div>
        </div>
        <header>
            <h1>
                <img
                    src="/images/simbol_s.png"
                    alt="킥보드주정차위반신고"
                    onClick={() => setActiveTab("홈")}
                    style={{ cursor: 'pointer' }}
                />
            </h1>

            {/* 로그인 상태에 따른 메시지 분기 */}
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
                {/* Next.js이므로 a 태그 대신 Link 사용 권장, 클래스명은 그대로 유지 */}
                <Link href="/alarm" className="btnalarm" onClick={(e) => handleProtectedAction(e, "/alarm")}
                >알림</Link>

                <Link href="/set" className="btnset"
                      onClick={(e) => handleProtectedAction(e, "/set")}
                >환경설정</Link>
            </div>

            <nav>
                <ul>
                    <li className={activeTab === "홈" ? "click" : ""}>
                        <a
                            href="#"
                            className="menuHome"
                            title={activeTab === "홈" ? "선택됨" : ""}
                            onClick={(e) => { e.preventDefault(); setActiveTab("홈"); }}
                        >
                            홈
                        </a>
                    </li>
                    {/* 신고확인: 로그인 체크 적용 */}
                    <li className={activeTab === "신고확인" ? "click" : ""}>
                        <a
                            href="#"
                            className="menuReport"
                            onClick={(e) => handleProtectedAction(e, "신고확인")}
                        >
                            신고확인
                        </a>
                    </li>
                    <li className={activeTab === "공지사항" ? "click" : ""}>
                        <a
                            href="#"
                            className="menuBoard"
                            onClick={(e) => { e.preventDefault(); setActiveTab("공지사항"); }}
                        >
                            공지사항
                        </a>
                    </li>
                </ul>
            </nav>
        </header>

        </>
    );
}