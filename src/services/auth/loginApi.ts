import {authApi} from "../api";
import {ApiResponse} from "@/types/auth";
import {LoginData, LoginResponseData} from "@/types/login";

export const loginService = {
    /*
    * 서비스 관리자 로그인 API
    * */
    login: async (data: LoginData): Promise<ApiResponse<LoginResponseData>> => {
        const response = await authApi.post<ApiResponse<LoginResponseData>>(
            "/api-auth/admin/login",
            data
        );

        return response.data;
    },
};