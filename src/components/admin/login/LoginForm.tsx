"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { handleApiError } from "@/hooks/errorHandler"; // 공통 에러 핸들러
import { useFcmToken } from "@/hooks/useFcmToken"; // 공통 FCM 훅
import { Lock, User } from "lucide-react";
import api from "@/services/api";
import { ApiResponse, UserData } from "@/types/auth";
import { setCookie } from "cookies-next";
import RegisterForm from "@/components/RegisterForm";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/hooks/useFCM"; 

export default function LoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const        setRole = useAuthStore((state) => state.setRole);
  const { fetchFcmToken, getDeviceInfo } = useFcmToken();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginToast = toast.loading("로그인 중...");

    try {
      const deviceType = getDeviceInfo();
      const fcmToken = await handleAllowNotification();
      const response = await api.post<ApiResponse<UserData>>("api/auth/login", { 
        loginId, 
        password,
        deviceType,
        fcmToken
      });
      
      const authHeader = response.headers['authorization']; 
      if (!authHeader) throw new Error("인증 토큰을 받을 수 없습니다.");

      const { success, data, message } = response.data;

      if (!success || !data) {
        throw new Error(message || "로그인 정보가 올바르지 않습니다.");
      }

      const { role, name } = data;

      setAccessToken(authHeader);
      setRole(role);
      setCookie('accessToken', authHeader, { path: '/' });

      toast.success(`${name}님, 반갑습니다!`, { id: loginToast });
      router.replace("/");

    } catch (err: any) {
      toast.dismiss(loginToast);
      handleApiError(err, "로그인 정보가 올바르지 않습니다.");
    }
  };

  return (
    <>
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              placeholder="사번 또는 아이디"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="password"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 transition-colors"
        >
          로그인하기
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          계정이 없으신가요?{" "}
          <button 
            onClick={() => setIsRegisterOpen(true)}
            className="text-yellow-600 font-bold hover:underline ml-1"
          >
            회원가입 신청
          </button>
        </p>
      </div>
      
      {isRegisterOpen && <RegisterForm onSuccess={() => setIsRegisterOpen(false)} />}
    </>
  );
}


const handleAllowNotification = async () => {
      const isSupported = 
        typeof window !== "undefined" && 
        "serviceWorker" in navigator &&
        (location.protocol === "https:" || location.hostname === "localhost");
    console.log(isSupported);
      if (!isSupported) return null;
  
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return null;
  
        // 서비스 워커 등록 확인
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        await navigator.serviceWorker.ready;
  
        // FCM 토큰 가져오기
        const messaging = getFirebaseMessaging();
        if (!messaging) return null;
  
        const currentToken =  await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        
        console.log(currentToken);
        return currentToken;
      } catch (error) {
        console.error("FCM 설정 에러:", error);
        return null;
      }
  };