"use client";

import {useEffect, useState} from "react";
import { useRouter, usePathname } from "next/navigation";
import { handleApiError } from "@/hooks/errorHandler";
import { useFcmToken } from "@/hooks/useFcmToken";
import { setCookie } from "cookies-next";
import { useAuthStore, MemberRole } from "@/store/authStore"; // MemberRole 타입 추가
import { toast } from "react-hot-toast";
import { loginService } from "@/services/auth/loginApi";
import RegisterForm from "@/components/RegisterForm";

export default function LoginForm() {
    const [userId, setUserId] = useState("");
    const [pswd, setPswd] = useState("");
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [saveId, setSaveId] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname(); // Next.js 권장 방식인 usePathname 사용

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const Token = useAuthStore((state) => state);
    // 1. 현재 경로에 따른 타입 판별 (미들웨어 및 스토어 연동용)
    const getAuthType = () => {
        if (pathname.startsWith("/admin")) return "admin";
        if (pathname.startsWith("/pm")) return "pm";
        if (pathname.startsWith("/tow")) return "tow";
        return "reporter";
    };
    const authType = getAuthType();
    const prefix = authType === "reporter" ? "" : `/${authType}`;


    const accessToken = useAuthStore((state) => state[authType].accessToken);
    const { setAdminAuth, setPmAuth, setTowAuth, setReporterAuth } = useAuthStore();


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
            const accessToken = apiResponse.data?.accessToken;

            if (!accessToken) throw new Error("인증 토큰이 없습니다.");
            if (!apiResponse.success) throw new Error(apiResponse.message || "로그인 실패");

            const { data } = apiResponse;
            const { role, userNm, userId: resUserId } = data.userInfo;
            const userInfo = { name: userNm, id: resUserId, role: role as MemberRole };

            // 3. 경로에 맞는 스토어에 저장

            if (authType === "admin") setAdminAuth(accessToken, userInfo);
            else if (authType === "pm") setPmAuth(accessToken, userInfo);
            else if (authType === "tow") setTowAuth(accessToken, userInfo);
            else setReporterAuth(accessToken, userInfo);

            setCookie(`${authType}AccessToken`, accessToken, {
                maxAge: 60 * 60 * 24,
                path: '/', // 전체 경로에서 접근 가능하도록 설정 권장
            });

            // FCM 프로세스
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
                        await saveTokenToServer(fcmToken, accessToken);
                    }
                } catch (fcmErr) {
                    console.error("FCM 동기화 실패:", fcmErr);
                }
            };
            await processFcm();

            toast.success(`${userNm}님, 반갑습니다!`, { id: loginToast });

            // 동적 경로 이동
            router.replace(`${prefix}/`);

        } catch (err: any) {
            toast.dismiss(loginToast);

            if (err.response?.status === 409) {
                const userRole = err.response.data?.role;
                if (userRole == "REPORT_USER") {
                    return handleLogin(undefined, true);
                } else {
                    if (confirm("이미 다른 기기에서 로그인 중입니다. 기존 연결을 끊고 여기서 로그인하시겠습니까?")) {
                        console.log("새로운 로그인 시작");
                        return handleLogin(undefined, true);
                    }
                }
                return;
            }

            handleApiError(err, err.response?.data.resultMsg);
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
                        </div>

                        <button type="submit" className="btn_login">로그인</button>
                    </form>
                </div>
            </div>

            {/* 필요 시 회원가입 모달 추가 */}
            {isRegisterOpen && <RegisterForm onSuccess={() => setIsRegisterOpen(false)} />}
        </div>
    );
}