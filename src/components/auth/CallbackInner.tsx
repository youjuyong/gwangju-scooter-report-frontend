"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { setCookie } from "cookies-next";

export default function OAuth2Callback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");

    if (accessToken) {
      // 토큰 저장
      setAccessToken(accessToken);
      setCookie('accessToken', accessToken);
      router.replace("/");
    }
  }, [searchParams]);

  return null;
}