"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Info } from "lucide-react"; // 아이콘 라이브러리
import { api } from "@/services/api"; // 위에서 만든 api 설정
import { setCookie, deleteCookie } from "cookies-next"; // npm install cookies-next 추천
import { getFirebaseMessaging } from "@/hooks/useFCM"; 
import { getToken } from "firebase/messaging";

export default function LoginPage() {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
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
      console.log(empId, password);
      try {
        // 1. API 호출 (async/await 방식)
        const response = await api.post("/auth/login", { empId: empId, empPwd: password });
        const result = response.data.result;
        console.log(response);
        // 2. 데이터 가공 (기존 yn 함수 로직)
        const yn = (v: any): "Y" | "N" => (v === "Y" ? "Y" : "N");

        // dispatch(setAccessToken(result.accessToken));

        setCookie('accessToken', result.accessToken); 
        
        const fcmToken = await handleAllowNotification();
        if (fcmToken) {
          await saveFcmToken(fcmToken, result.accessToken);
        }

        // 5. 페이지 이동 (navigate 대신 router.push)
        if (result.empResponse.initYn !== "N") {
        //  router.replace("/main/UseIntro/Content/Works/main");
          router.push("/main");
          router.replace("/main");
        } else {
        //    router.replace("/Password_Change");
        }

        // 6. 알림 권한 체크 (기존 함수 호출)
        // handleAllowNotification();

      } catch (err: any) {
        // 에러 핸들링 (기존 로직 그대로)
        const resultCode = err?.response?.data?.resultCode;
        if (resultCode === "E001") {
          setErrorMsg("패스워드가 일치하지 않습니다.");
        } else if (resultCode === "E004") {
          setErrorMsg("존재하지 않는 아이디 입니다.");
        } else {
          setErrorMsg("알 수 없는 오류가 발생했습니다.");
        }
        
        setPassword(""); // 비번 비우기
        pwInputRef.current?.focus();
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        {/* 헤더 부분 */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🛴</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">PM 신고 시스템</h2>
          <p className="mt-2 text-sm text-gray-600">관리자 계정으로 로그인하세요</p>
        </div>

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
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
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

        {/* 푸터 안내 */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-4">
          <Info size={14} />
          <span>계정 분실 시 전산팀에 문의하세요.</span>
        </div>
      </div>
    </div>
  );
}