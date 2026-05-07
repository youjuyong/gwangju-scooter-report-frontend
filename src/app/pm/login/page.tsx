"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { handleApiError } from "@/hooks/errorHandler";
import { useFcmToken } from "@/hooks/useFcmToken";
import { setCookie } from "cookies-next";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import { loginService } from "@/services/auth/loginApi";
import RegisterForm from "@/components/RegisterForm";

export default function LoginForm() {
  const [userId, setUserId] = useState("");
  const [pswd, setPswd] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [saveId, setSaveId] = useState(false); // ID 저장 체크박스 상태

  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRole = useAuthStore((state) => state.setRole);

  const {
    handleAllowNotification,
    getDeviceInfo,
    saveTokenToServer,
    fetchFcmTokenForCallback
  } = useFcmToken();

  const ERROR_MESSAGES: Record<string, string> = {
    "E008": "비밀번호 오류 횟수 초과로 계정이 잠겼습니다. 관리자에게 문의하세요.",
  };

  const handleLogin = async (e?: React.FormEvent, forceLogin: boolean = false) => {
    if (e) e.preventDefault();

    if (!userId) return toast.error("아이디를 입력해주세요.");
    if (!pswd) return toast.error("비밀번호를 입력해주세요.");

    const loginToast = toast.loading("로그인 중...");

    try {
      const response = await loginService.login({ userId, pswd, forceLogin });
      const apiResponse = response;
      const authHeader = apiResponse.data?.accessToken;

      if (!authHeader) throw new Error("인증 토큰이 없습니다.");
      if (!apiResponse.success) throw new Error(apiResponse.message || "로그인 실패");

      const { data } = apiResponse;
      const { role, userNm } = data.userInfo;

      // 상태 저장
      setAccessToken(authHeader);
      setRole(role);
      setCookie('accessToken', authHeader);

      // FCM 프로세스 (비동기)
      const processFcm = async () => {
        try {
          const deviceType = getDeviceInfo();
          let fcmToken = null;
          if (deviceType === "iOS") {
            fcmToken = await fetchFcmTokenForCallback();
          } else {
            fcmToken = await handleAllowNotification();
          }
          if (fcmToken) {
            await saveTokenToServer(fcmToken, authHeader);
          }
        } catch (fcmErr) {
          console.error("FCM 동기화 실패:", fcmErr);
        }
      };
      await processFcm();

      toast.success(`${userNm}님, 반갑습니다!`, { id: loginToast });
      router.replace("/");

    } catch (err: any) {
      toast.dismiss(loginToast);

      // 중복 로그인 처리
      if (err.response?.status === 409) {
        const userRole = err.response.data?.role;
        if (userRole === "USER") {
          return handleLogin(undefined, true);
        } else {
          if (confirm("이미 다른 기기에서 로그인 중입니다. 기존 연결을 끊고 여기서 로그인하시겠습니까?")) {
            return handleLogin(undefined, true);
          }
        }
        return;
      }

      const resultCode = err.response?.data.resultCode;
      if (resultCode === "E008") {
        toast.error(ERROR_MESSAGES[resultCode]);
        return;
      }

      handleApiError(err, "로그인 정보가 올바르지 않습니다.");
    }
  };

  return (
      <div className="wrap loginWrap">
        <header>
          <h1>
            <img src="/images/simbol_s.png" alt="simbol" /> 방치 킥보드 회수 시스템
          </h1>
        </header>

        <div className="loginback">
          <div className="login_img">
            <img src="/images/main_all_img.png" alt="광주시 방치킥보드 회수 시스템" className="mainImg" />
          </div>

          <div className="loginBox">
            <h2>LOGIN</h2>
            <form className="logoin_conten" onSubmit={handleLogin}>
              <input
                  className="id"
                  type="text"
                  placeholder="ID(휴대폰번호)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
              />
              <input
                  className="pw"
                  type="password"
                  placeholder="비밀번호"
                  value={pswd}
                  onChange={(e) => setPswd(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>
                  <input
                      type="checkbox"
                      checked={saveId}
                      onChange={(e) => setSaveId(e.target.checked)}
                  /> ID저장
                </label>

                {/* 회원가입 버튼 추가 */}
                <button
                    type="button"
                    onClick={() => setIsRegisterOpen(true)}
                    style={{ fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  회원가입 신청
                </button>
              </div>

              <button type="submit" className="btn_login">로그인</button>
            </form>
          </div>
        </div>

        {/* 회원가입 모달 */}
        {isRegisterOpen && <RegisterForm onSuccess={() => setIsRegisterOpen(false)} />}
      </div>
  );
}