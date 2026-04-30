"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { deleteCookie } from "cookies-next";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";
import {authApi} from "@/services/api";
import axios from "axios";
import {useFcmToken} from "@/hooks/useFcmToken";

export default function SettingsPage() {
    const router = useRouter();
    const { getDeviceInfo } = useFcmToken();
    const deviceType = getDeviceInfo();
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setRole = useAuthStore((state) => state.setRole);

    // 1. 푸시 알림 로컬 상태 (실제로는 API와 연동 권장)
    const [isPushOn, setIsPushOn] = useState(false);


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


    const togglePush = () => {
        setIsPushOn((prev) => !prev);
        toast.success(`알림이 ${!isPushOn ? "설정" : "해제"}되었습니다.`);
    };

    return (
        <div className="wrap noMenubody">
            <header>
                <h1>설정</h1>
                <button
                    type="button"
                    className="back"
                    onClick={() => router.back()}
                    aria-label="이전 페이지로 이동"
                >
                    뒤로 가기
                </button>
            </header>

            <main className="sub_article set_article">
                <ul className="set_box">
                    {/* 푸시알림 설정 */}
                    <li className="pushbox">
                        <label htmlFor="push-toggle">푸시알림</label>
                        <button
                            className={isPushOn ? "btn_on" : "btn_off"}
                            id="push-toggle"
                            type="button"
                            aria-pressed={isPushOn}
                            onClick={togglePush}
                        >
                            {isPushOn ? "on" : "off"}
                        </button>
                    </li>

                    <li>
                        <Link href="/terms" className="go_agree">
                            약관 조회
                        </Link>
                    </li>

                    {/* 로그아웃 */}
                    <li>
                        <button
                            type="button"
                            className="logout"
                            aria-label="로그아웃"
                            onClick={handleLogout}
                        >
                            로그아웃
                        </button>
                    </li>
                </ul>
            </main>
        </div>
    );
}