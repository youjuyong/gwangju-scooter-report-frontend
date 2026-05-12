import {authApi} from "../api";
import {ApiResponse} from "@/types/auth";
import {LoginData, LoginResponseData} from "@/types/login";

export const loginService = {
    /*
    *  pm 로그인 API
    * */
    login: async (data: LoginData): Promise<ApiResponse<LoginResponseData>> => {
        const response = await authApi.post<ApiResponse<LoginResponseData>>(
            "/pm/login",
            data
        );

        return response.data;
    },
};