"use client";

import {useRouter} from "next/navigation";
import {useAuthStore} from "@/store/authStore";
import {deleteCookie} from "cookies-next";
import {toast} from "react-hot-toast";
import Link from "next/link";
import {useEffect, useState} from "react";
import {authApi} from "@/services/api";
import axios from "axios";
import {useFcmToken} from "@/hooks/useFcmToken";
import {useAlert} from "@/components/popup/PopupProvider";
import {useSseStore} from "@/store/sseStore";

export default function SettingsPage() {
    const router = useRouter();
    const {
        getDeviceInfo,
        fetchFcmToken,
        saveTokenToServer,
        fetchFcmTokenForCallback,
        deleteTokenToServer
    } = useFcmToken();
    const deviceType = getDeviceInfo();
    const authType = "reporter";
    const state = useAuthStore();
    const showAlert = useAlert();
    const currentAuth = state[authType];
    const {logout, updateFcmToken} = state;
    const clearAlarms = useSseStore((state) => state.clearAlarms);

    const [mounted, setMounted] = useState(false);
    const [isSafari, setIsSafari] = useState(false);

    const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

    // 현재 푸시 상태 확인
    const isPushOn = mounted && !isSafari && hasNotificationPermission && !!currentAuth?.fcmToken;

    //토글 상태값
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            setMounted(true);

            const userAgent = navigator.userAgent;

            const safariMode =
                /Safari/.test(userAgent) &&
                !/Chrome/.test(userAgent) &&
                !/Chromium/.test(userAgent) &&
                !/CriOS/.test(userAgent) &&
                !/FxiOS/.test(userAgent) &&
                !/KAKAOTALK/.test(userAgent) &&
                !/NAVER/.test(userAgent);

            const isApp = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
            const hasNoNotification = !('Notification' in window);

            if ((safariMode || hasNoNotification) && !isApp) {
                setIsSafari(true);
            } else {
                setIsSafari(false);
            }
            try {
                if ("Notification" in window && window.Notification) {
                    setHasNotificationPermission(window.Notification.permission === 'granted');
                }
            } catch (error) {
                console.error(error);
                setHasNotificationPermission(false);
            }
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    const handleLogout = async () => {
        if (!await showAlert("로그아웃 하시겠습니까?")) return;
        try {
            // 백엔드에 로그아웃 알림 (기기 정보 전달)
            await authApi.post("/logout", {deviceType});
            // 클라이언트 상태 및 쿠키 삭제
            logout(authType);
            deleteCookie(`${authType}AccessToken`);
            delete axios.defaults.headers.common["Authorization"];
            clearAlarms(); //알림 리스트 삭제
            toast.success("로그아웃되었습니다.");
            router.replace("/");
        } catch (error) {
            console.error("로그아웃 실패:", error);
            toast.error("로그아웃 중 오류가 발생했습니다.");
        }
    };

    // 푸시 알림 토글 기능 핵심 로직
    const togglePush = async () => {
        const toastId = "push-toggle-toast";

        if (!isPushOn) {
            // OFF -> ON 하려는 경우
            if (isSafari) {
                toast.error("iOS/Safari 환경에서는 '홈 화면에 추가'를 통해 앱을 설치하셔야 알림 설정이 가능합니다.");
                return;
            } else {
                toast.loading("알림 설정을 활성화 중입니다...", {id: toastId});
            }
            try {

                let currentFcmToken = null;
                if (deviceType === "iOS") {
                    currentFcmToken = await fetchFcmTokenForCallback();
                } else {
                    currentFcmToken = await fetchFcmToken();
                }
                if (currentFcmToken) {
                    await saveTokenToServer(currentFcmToken, currentAuth.accessToken!);
                    updateFcmToken(authType, currentFcmToken);

                    setHasNotificationPermission(true);
                    // setIsPushOn(true);
                    toast.success("푸시 알림이 활성화되었습니다.", {id: toastId});
                } else {
                    toast.error("알림 권한이 거부되었거나 설정에 실패했습니다.", {id: toastId});
                }
            } catch (error) {
                toast.error("설정 중 오류가 발생했습니다.", {id: toastId});
            }
        } else {

            if (await showAlert("알림을 끄시겠습니까? \n (기기 설정에서 권한을 차단해야 \n 완전히 해제됩니다)")) {
                try {
                    // fcmToken 토큰 삭제
                    await deleteTokenToServer(currentAuth.accessToken!);
                    updateFcmToken(authType, null);
                    // setIsPushOn(false);
                    toast.success("앱 내 알림 수신이 비활성화되었습니다.");
                } catch (error) {
                    toast.error("처리 중 오류가 발생했습니다.");
                }
            }
        }
    };

    return (
        <div className="wrap noMenubody">
            <header>
                <h1>설정</h1>
                <Link href="/" className="back" style={{cursor: 'pointer'}}>뒤로 가기</Link>
            </header>

            <main className="sub_article set_article">
                <ul className="set_box">
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
                        <Link href="/set/agree" className="go_agree">
                            약관 조회
                        </Link>
                    </li>

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