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
    // 1. 기본 인증 정보 설정
    setAccessToken(accessToken);
    setRole(UserRole.USER);
    setCookie('accessToken', accessToken);

    const processFcm = async () => {
      try {
        // 토큰 저장 중임을 알림 (디버깅 겸 흐름 제어)
        const loadingToast = toast.loading("알림 설정을 동기화 중입니다...");

        const fcmToken = await fetchFcmToken();
        
        if (fcmToken) {
          // 서버 저장이 완료될 때까지 '확실히' 기다림
          await saveTokenToServer(fcmToken, accessToken);
          toast.success("로그인 및 알림 설정 완료!", { id: loadingToast });
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