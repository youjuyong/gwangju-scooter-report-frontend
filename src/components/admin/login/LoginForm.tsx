"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {handleApiError} from "@/hooks/errorHandler"; // 공통 에러 핸들러
import {useFcmToken} from "@/hooks/useFcmToken"; // 공통 FCM 훅
import {Lock, User} from "lucide-react";
import {setCookie} from "cookies-next";
import RegisterForm from "@/components/RegisterForm";
import {useAuthStore} from "@/store/authStore";
import {toast} from "react-hot-toast";
import {loginService} from "@/services/auth/loginApi";

export default function LoginForm() {
    const [userId, setUserId] = useState("");
    const [pswd, setPswd] = useState("");
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

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
        const loginToast = toast.loading("로그인 중...");

        try {
            const response = await loginService.login({userId, pswd, forceLogin});

            const apiResponse = response;
            const authHeader = apiResponse.data?.accessToken;
            if (!authHeader) throw new Error("인증 토큰이 없습니다.");
            if (!apiResponse.success) throw new Error(apiResponse.message || "로그인 실패");

            const {success, data, message} = apiResponse;

            if (!success || !data) {
                throw new Error(message || "로그인 정보가 올바르지 않습니다.");
            }

            const {role, userNm} = apiResponse.data.userInfo;

            setAccessToken(authHeader);
            setRole(role);
            setCookie('accessToken', authHeader);

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

            toast.success(`${userNm}님, 반갑습니다!`, {id: loginToast});
            router.replace("/");

        } catch (err: any) {
            toast.dismiss(loginToast);

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
            const message = ERROR_MESSAGES[resultCode]
            if (resultCode === "E008") {
                toast.error(message);
                return;
            }

            handleApiError(err, "로그인 정보가 올바르지 않습니다.");
        }
    };

    return (
        <>
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>
                        <input
                            type="text"
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                            placeholder="사번 또는 아이디"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>
                        <input
                            type="password"
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                            placeholder="비밀번호"
                            value={pswd}
                            onChange={(e) => setPswd(e.target.value)}
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

            {isRegisterOpen && <RegisterForm onSuccess={() => setIsRegisterOpen(false)}/>}
        </>
    );
}


