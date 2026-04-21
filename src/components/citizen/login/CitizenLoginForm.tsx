"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react"; 
import api from "@/services/api";
import { handleApiError } from "@/hooks/errorHandler";
import { useFcmToken } from "@/hooks/useFcmToken"; // 공통 FCM 훅
import { setCookie } from "cookies-next";
import { ApiResponse, UserData } from "@/types/auth"; 
import RegisterForm from "@/components/RegisterForm";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import {useSqlValidator} from "@/hooks/useSqlValidator";

export default function CitizenLoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const        setRole = useAuthStore((state) => state.setRole);
 const { handleAllowNotification, getDeviceInfo } = useFcmToken();
    const { sqlValidate } = useSqlValidator(); // 훅 불러오기
  // 일반 로그인 처리

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();

      // 전송 직전에 검사!
      if (!sqlValidate(loginId)) {
          return; // 검사 탈락 시 여기서 중단 (toast 훅 내부에서 뜸)
      }

    const loginToast = toast.loading("로그인 중...");

    try {
      const deviceType = getDeviceInfo();
      const fcmToken = await handleAllowNotification();
      const response = await api.post<ApiResponse<UserData>>("/auth/login", { 
        loginId: loginId, 
        password: password,
        deviceType: deviceType,
        fcmToken: fcmToken
      });
      const apiResponse = response.data;
      const authHeader = response.headers['authorization']; 

      if (!authHeader) throw new Error("인증 토큰이 없습니다.");
      if (!apiResponse.success) throw new Error(apiResponse.message || "로그인 실패");

      const { role, name } = apiResponse.data;

      setAccessToken(authHeader);
      setCookie('accessToken', authHeader);
      setRole(role);

      toast.success(`${name}님, 반갑습니다!`, { id: loginToast });
      router.replace("/");

    } catch (err: any) {
      toast.dismiss(loginToast);
      handleApiError(err, "아이디 또는 비밀번호를 확인해주세요.");
    }
  };

  const oauthHandleLogin = async (provider:string) => {
    const deviceType = getDeviceInfo();
    const loginUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/oauth2/authorization/${provider}`;
  
    // 1. iOS인 경우에만 알림 권한 체크 및 요청
    if (deviceType === "iOS") {
      if ("Notification" in window && Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.error("iOS 알림 권한 요청 실패:", error);
        }
      }
    }

    // 2. 공통 로그인 처리 (권한 허용/거부와 상관없이 진행)
    toast.loading(`${provider === 'kakao' ? '카카오' : '네이버'}로 연결 중...`);
    window.location.href = loginUrl;
  };
  
  return (
      <>
        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>
              <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                  placeholder="아이디 또는 휴대폰 번호"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 transition-colors shadow-lg active:scale-95"
          >
            로그인하기
          </button>
        </form>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-400 font-medium">또는</span>
          </div>
        </div>

        {/* 시민 전용: 카카오 버튼 */}
        <button
            onClick={() => oauthHandleLogin('kakao')}
            className="w-full flex justify-center items-center py-3.5 bg-[#FEE500] hover:bg-[#FADA0A] text-black rounded-xl font-bold transition-all shadow-md active:scale-95"
        >
          <span className="mr-2 text-lg">💬</span> 카카오로 시작하기
        </button>
        <button
            onClick={() => oauthHandleLogin('naver')}
            className="w-full flex justify-center items-center py-3.5 bg-[#03C75A] hover:bg-[#00D462] text-black rounded-xl font-bold transition-all shadow-md active:scale-95"
        >
          <span className="mr-2 text-lg"></span> 네이버로 시작하기
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 font-medium">
            계정이 없으신가요?{" "}
            <button
                onClick={() => setIsRegisterOpen(true)}
                className="text-yellow-600 font-black hover:underline ml-1"
            >
              회원가입 신청
            </button>
          </p>
        </div>

        {isRegisterOpen && <RegisterForm onSuccess={() => setIsRegisterOpen(false)}/>}
      </>
  );
}