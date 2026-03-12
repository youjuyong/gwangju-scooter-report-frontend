"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Info } from "lucide-react"; // 아이콘 라이브러리
import api from "@/services/api"; // 위에서 만든 api 설정
import { setCookie, deleteCookie } from "cookies-next"; // npm install cookies-next 추천
import RegisterForm from "@/components/RegisterForm";
import { getFirebaseMessaging } from "@/hooks/useFCM"; 
import { useAuthStore } from "@/store/authStore";
import { getToken } from "firebase/messaging";


export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const pwInputRef = useRef<HTMLInputElement>(null);

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "android";
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    return "web";
  };

  const getOrCreateDeviceId = () => {
    if (typeof window === "undefined") return "";
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  // --- [추가] 알림 권한 요청 및 토큰 생성 ---
  const handleAllowNotification = async () => {
    const isSupported = 
      typeof window !== "undefined" && 
      "serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost");

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

      const currentToken = await getToken(messaging, {
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

  // --- [추가] 서버에 토큰 저장 ---
  const saveFcmToken = async (fcmToken: string, accessToken: string) => {
    try {
      await api.post("/api/fcm/token", {
        fcmToken: fcmToken,
        deviceType: getDeviceType(),
        deviceId: getOrCreateDeviceId(),
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log("FCM 토큰 서버 저장 완료");
    } catch (error) {
      console.error("FCM 토큰 저장 실패:", error);
    }
  };

  useEffect(() => {
    handleAllowNotification();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // 1. API 호출 (async/await 방식)
        const response:any = await api.post("api/auth/login", { loginId: loginId, password: password });
        const result = response.data.result;

       const authHeader = response.headers['authorization']; 
        setAccessToken(authHeader);
        setCookie('accessToken', authHeader);
        
        const fcmToken = await handleAllowNotification();
        // if (fcmToken) {
        //   await saveFcmToken(fcmToken);
        // }

        router.push("/main");
        router.replace("/main");

      } catch (err: any) {
        handleLoginError(err); // 에러 핸들링 로직 분리
      }
  };

  const handleLoginError = (err: any) => {
    const resultCode = err?.response?.data?.resultCode;
    const messageMap: { [key: string]: string } = {
      "E001": "패스워드가 일치하지 않습니다.",
      "E004": "존재하지 않는 아이디 입니다."
    };

    alert(err.message);
    setPassword("");
    pwInputRef.current?.focus();
  };

  return (
    <>
        {/* 로그인 폼 */}
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

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            >
              로그인하기
            </button>
          </div>
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