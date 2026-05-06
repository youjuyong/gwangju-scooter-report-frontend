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
    const setFcmToken = useAuthStore((state) => state.setFcmToken);

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
                
                const toastId = "fcm-sync-toast";
                toast.loading("알림 설정을 동기화 중입니다...", { id: toastId });

                try {
                    let fcmToken = null;

                    if (deviceType === "iOS") {
                        fcmToken = await fetchFcmTokenForCallback();
                    } else {
                        fcmToken = await fetchFcmToken();
                    }

                    if (fcmToken) {
                        setFcmToken(fcmToken);
                        await saveTokenToServer(fcmToken, accessToken);
                        
                        toast.success("로그인 및 알림 설정 완료", { id: toastId });
                        
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    } else {
                        toast.error("알림 권한이 없어 설정을 건너뜁니다.", { id: toastId });
                        console.warn("FCM 토큰 획득 실패");
                        
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                } catch (err) {
                    console.error("OAuth2 FCM Error:", err);
                    toast.error("알림 설정 중 오류가 발생했습니다.", { id: toastId });
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } finally {
                    router.replace("/");
                }
         };

            processFcm();
        }
    }, [searchParams, router]);

    return null;
}