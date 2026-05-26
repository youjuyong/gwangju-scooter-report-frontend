"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, MemberRole } from "@/store/authStore";
import { useFcmToken } from "@/hooks/useFcmToken";
import { setCookie } from "cookies-next";

export default function OAuth2Callback() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // 1. 스토어 액션들 가져오기
    const { setAdminAuth, setPmAuth, setTowAuth, setReporterAuth } = useAuthStore();
    const { fetchFcmToken, saveTokenToServer, getDeviceInfo, fetchFcmTokenForCallback } = useFcmToken();
    const state = useAuthStore();
    const { updateFcmToken } = state;

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const userName = searchParams.get('userName');
        const userId = searchParams.get("userId");
        const role = searchParams.get("role") as MemberRole; // 백엔드에서 주는 Role
        const bzentyNm = searchParams.get("bzentyNm");

        if (accessToken) {
            // 2. Role에 따라 어떤 그룹(authType)에 저장할지 결정
            let authType: "admin" | "pm" | "tow" | "reporter" = "reporter";
            const userInfo = { name: userName, id: userId, role: role , bzentyNm:bzentyNm};

            if (role === "ADMIN" || role === "OPERATOR") {
                setAdminAuth(accessToken, userInfo);
                authType = "admin";
            } else if (role === "PM_CORP") {
                setPmAuth(accessToken, userInfo);
                authType = "pm";
            } else if (role === "TOW_CORP") {
                setTowAuth(accessToken, userInfo);
                authType = "tow";
            } else {
                setReporterAuth(accessToken, userInfo);
                authType = "reporter";
            }

            // 3. 해당 권한 전용 쿠키 설정 (미들웨어용)
            setCookie(`${authType}AccessToken`, accessToken, {
                maxAge: 60 * 60 * 24,
                path: '/',
            });

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
                        updateFcmToken(authType, fcmToken);
                        await saveTokenToServer(fcmToken, accessToken);
                        toast.success("로그인 및 알림 설정 완료", { id: toastId });
                    } else {
                        toast.error("알림 권한이 없어 설정을 건너뜁니다.", { id: toastId });
                    }
                } catch (err) {
                    console.error("OAuth2 FCM Error:", err);
                    toast.error("알림 설정 중 오류가 발생했습니다.", { id: toastId });
                } finally {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // 4. 권한에 맞는 대시보드로 이동
                    const prefix = authType === "reporter" ? "" : `/${authType}`;
                    router.replace(`${prefix}/`);
                }
            };

            processFcm();
        } else {
            // 토큰이 없으면 로그인 페이지로 튕기기
            toast.error("인증 정보가 없습니다.");
            router.replace("/");
        }
    }, [searchParams, router]);

    return null;
}