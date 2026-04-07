"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFcmToken } from "@/hooks/useFcmToken";
import { UserRole } from "@/types/auth";
import { setCookie } from "cookies-next";

export default function OAuth2Callback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchFcmToken, saveTokenToServer } = useFcmToken();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const        setRole = useAuthStore((state) => state.setRole);

  useEffect(() => {
  const accessToken = searchParams.get("accessToken");

  if (accessToken) {
    setAccessToken(accessToken);
    setRole(UserRole.USER);
    setCookie('accessToken', accessToken);

    const processFcm = async () => {
      try {
        const loadingToast = toast.loading("알림 설정을 동기화 중입니다...");

        const fcmToken = await fetchFcmToken();
        alert(`토큰 결과: ${fcmToken ? '성공' : '실패(null)'}`);
        if (fcmToken) {
          await saveTokenToServer(fcmToken, accessToken);
          toast.success("로그인 및 알림 설정 완료", { id: loadingToast });
        } else {
          toast.dismiss(loadingToast);
        }
      } catch (err) {
        console.error("OAuth2 FCM Error:", err);
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