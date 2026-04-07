"use client";

import { useEffect } from "react";
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
          const fcmToken = await fetchFcmToken();
          if (fcmToken) {
            await saveTokenToServer(fcmToken, accessToken);
          }
        } catch (err) {
          console.error("OAuth2 FCM Error:", err);
        } finally {
          router.replace("/");
        }
      };

      processFcm();
    }
  }, [searchParams]);

  return null;
}