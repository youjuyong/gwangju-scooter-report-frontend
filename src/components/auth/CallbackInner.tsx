"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFcmToken } from "@/hooks/useFcmToken";
import { setCookie } from "cookies-next";

export default function OAuth2Callback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchFcmToken, saveTokenToServer } = useFcmToken();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");

    if (accessToken) {
      // 토큰 저장
      setAccessToken(accessToken);
      setCookie('accessToken', accessToken);

      fetchFcmToken().then((fcmToken) => {
        if (fcmToken) {
          saveTokenToServer(fcmToken, accessToken);
        }
      }).catch(err => console.error("OAuth2 FCM Error:", err));

      router.replace("/");
    }
  }, [searchParams]);

  return null;
}