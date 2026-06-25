"use client";

import React, {useEffect, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {MemberRole, useAuthStore} from "@/store/authStore";
import {toast} from "react-hot-toast";
import {loginService} from "@/services/auth/loginApi";
import {setCookie} from "cookies-next";
import {useSqlValidator} from "@/hooks/useSqlValidator";

export default function LoginPage() {
    const [userId, setUserId] = useState("");
    const [pswd, setPswd] = useState("");
    const [saveId, setSaveId] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { sqlValidate } = useSqlValidator();

    useEffect(() => {
        setIsMounted(true);

        const savedUserId = localStorage.getItem("savedUserId");
        if (savedUserId) {
            setUserId(savedUserId);
            setSaveId(true);
        }
    }, []);

    const getAuthType = () => {
        if (pathname.startsWith("/admin")) return "admin";
        if (pathname.startsWith("/pm")) return "pm";
        if (pathname.startsWith("/tow")) return "tow";
        return "reporter";
    };
    const authType = getAuthType();
    const prefix = authType === "reporter" ? "" : `/${authType}`;

    const {setAdminAuth, setPmAuth, setTowAuth, setReporterAuth} = useAuthStore();

    const ERROR_MESSAGES: Record<string, string> = {
        "E008": "비밀번호 오류 횟수 초과로 계정이 잠겼습니다. 관리자에게 문의하세요.",
    };

    const handleLogin = async (e?: React.FormEvent, forceLogin: boolean = false) => {
        if (e) e.preventDefault();

        toast.dismiss();

        if (!userId) return toast.error("아이디를 입력해주세요.");
        if (!pswd) return toast.error("비밀번호를 입력해주세요.");

        //SQL인젝션 방어
        if (!sqlValidate(userId)) {
            return;
        }

        const toastId = "login-process-toast";
        toast.loading("로그인 정보 확인 중...", {id: toastId});

        try {
            const response = await loginService.login({userId, pswd, forceLogin});

            const apiResponse = response;
            const accessToken = apiResponse.data?.accessToken;

            if (!accessToken) throw new Error("인증 토큰이 없습니다.");
            if (!apiResponse.success) throw new Error(apiResponse.message || "로그인 실패");

            const {data} = apiResponse;
            const {role, userNm, userId: resUserId, bzentyNm} = data.userInfo;
            const userInfo = {name: userNm, id: resUserId, role: role as MemberRole, bzentyNm: bzentyNm};
            if (saveId) {
                localStorage.setItem("savedUserId", userId);
            } else {
                localStorage.removeItem("savedUserId");
            }

            if (authType === "admin") setAdminAuth(accessToken, userInfo);
            else if (authType === "pm") setPmAuth(accessToken, userInfo);
            else if (authType === "tow") setTowAuth(accessToken, userInfo);
            else setReporterAuth(accessToken, userInfo);

            setCookie(`${authType}AccessToken`, accessToken, {
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            toast.success(`${userNm}님, 반갑습니다!`, {id: toastId});

            router.replace(`${prefix}/`);

        } catch (err: any) {
            toast.dismiss(toastId);
            if (err.response?.status === 409) {
                const userRole = err.response.data?.role;
                if (userRole == "REPORT_USER ") {
                    return handleLogin(undefined, true);
                } else {
                    if (window.confirm("다른 기기에서 로그인중입니다.\n여기서 로그인하시겠습니까?")) {
                        return handleLogin(undefined, true);
                    }
                }
                return;
            }

            const resultCode = err.response?.data.resultCode;
            if (resultCode === "E008") {
                toast.error(ERROR_MESSAGES[resultCode]);
                return;
            } else if (resultCode === "E005") {
                toast.error(err.response?.data.resultMsg);
            } else if (resultCode === "E001") {
                toast.error(err.response?.data.resultMsg);
            } else if (resultCode === "E002") {
                toast.error(err.response?.data.resultMsg);
            }
        }
    };

    return (
        <div className="loginbody">
            <div className="loginBox">
                <h1><span>방치킥보드관리시스템</span></h1>
                <div className="login_inputbox">
                    <form className="logoin_conten" onSubmit={handleLogin}>
                        <div className="inputbox">
                            <input
                                type="text"
                                placeholder="ID"
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
                        </div>
                        <label>
                            <input
                                type="checkbox"
                                checked={saveId}
                                onChange={(e) => setSaveId(e.target.checked)}
                            /> ID저장
                        </label>
                        <button className="btnLogin">로그인</button>
                    </form>
                </div>
                <div className="login_bottom_logo">
                    <img src="/assets/style_admin/images/logo2.png" alt="로고"/>
                </div>
            </div>
        </div>
    );
}