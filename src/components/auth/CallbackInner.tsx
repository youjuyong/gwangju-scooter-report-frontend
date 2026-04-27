"use client";

import {useEffect} from "react";
import {toast} from "react-hot-toast";
import {useRouter, useSearchParams} from "next/navigation";
import {useAuthStore} from "@/store/authStore";
import {useFcmToken} from "@/hooks/useFcmToken";
import {setCookie} from "cookies-next";

export default function OAuth2Callback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const {fetchFcmToken, saveTokenToServer, getDeviceInfo, fetchFcmTokenForCallback} = useFcmToken();
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setRole = useAuthStore((state) => state.setRole);
    const setUserInfo = useAuthStore((state) => state.setUserInfo);

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const userName = searchParams.get('userName');
        const userId = searchParams.get("userId");
        const role = searchParams.get("role");

        if (accessToken) {
            setAccessToken(accessToken);
            setUserInfo(userName, userId);
            setRole(role);
            setCookie('accessToken', accessToken);

            const processFcm = async () => {
                const deviceType = getDeviceInfo();
                const loadingToast = toast.loading("알림 설정을 동기화 중입니다...");

                try {
                    let fcmToken = null;

                    if (deviceType === "iOS") {
                        fcmToken = await fetchFcmTokenForCallback();
                    } else {
                        fcmToken = await fetchFcmToken();
                    }

                    if (fcmToken) {
                        await saveTokenToServer(fcmToken, accessToken);
                        toast.success("로그인 및 알림 설정 완료", {id: loadingToast});

                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        toast.dismiss(loadingToast);
                        console.warn("FCM 토큰을 획득하지 못해 서버 저장을 건너뜁니다.");
                    }
                } catch (err) {
                    console.error("OAuth2 FCM Error:", err);
                    toast.error("알림 설정 중 오류가 발생했습니다.", {id: loadingToast});
                } finally {
                    setTimeout(() => {
                        router.replace("/");
                    }, 500);
                }
            };

            processFcm();
        }
    }, [searchParams, router]);

    return null;
}