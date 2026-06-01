import {authApi} from "../api";
import {ApiResponse} from "@/types/auth";
import {LoginData, LoginResponseData} from "@/types/login";

const getDynamicBaseURL = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname; // 현재 경로 (예: /pm/main 또는 /tow/report)

        if (path.startsWith("/pm")) {
            return "/pm/login";
        }

        if (path.startsWith("/tow")) {
            return "/tow/login";
        }

        if (path.startsWith("/admin")) {
            return "/admin/login";
        }
    }
};

export const API_BASE_URL = getDynamicBaseURL();

export const loginService = {
    /*
    *  pm 로그인 API
    * */
    login: async (data: LoginData): Promise<ApiResponse<LoginResponseData>> => {
        const response = await authApi.post<ApiResponse<LoginResponseData>>(
            API_BASE_URL!,
            data
        );

        return response.data;
    },
};