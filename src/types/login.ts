export interface LoginData {
    userId: string;
    pswd: string;
    forceLogin: boolean;
}

export interface LoginResponseData {
    accessToken: string;
    accessTokenExpiresIn?: number | null;
    grantType?: string | null;
    refreshToken?: string | null;
    userInfo: {
        role: string;
        userNm: string;
        bzentyNm :string;
        userId: string;
        sessionId: string;
        deptId: string;
    }
}