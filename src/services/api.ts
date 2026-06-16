import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { MemberRole } from '@/store/authStore';
import { deleteCookie } from "cookies-next";
import { useAlarmStore } from '@/store/alamStore';

// CSRF 및 기본 설정 전역 적용
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

let isRefreshing = false;
let failedQueue: any[] = [];
let isSessionExpiredAlertShown = false;

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const getAuthTypeByPath = () => {
    if (typeof window === 'undefined') return 'reporter';
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/pm')) return 'pm';
    if (path.startsWith('/tow')) return 'tow';
    return 'reporter';
};

const handleDuplicateLogin = async (errorResponse: any, state: any, authType: string) => {
    if (isSessionExpiredAlertShown) return;
    isSessionExpiredAlertShown = true;

    const userRole = errorResponse.data?.data?.role as MemberRole;
    const serverMessage = errorResponse.data?.message || "다른 기기에서 로그인되어 연결이 종료되었습니다.";

    if (typeof window !== 'undefined') {
        if (authType === 'admin' || !(window as any).showAlert) {
            alert(serverMessage);
        } else {
            await (window as any).showAlert(serverMessage);
        }
    }

    state.logout(authType);

    if (typeof window !== 'undefined') {
        const pathMap: Record<string, string> = {
            'PM_CORP': '/pm/login',
            'TOW_CORP': '/tow/login',
            'REPORT_USER': '/',
            'ADMIN': '/admin/login',
        };
        window.location.href = pathMap[userRole] || '/';
    }

    setTimeout(() => { isSessionExpiredAlertShown = false; }, 5000);
};

const clearAuthSession = (authType: any, prefix: any) => {
    const { clearStore } = useAlarmStore.getState(); 
    const state = useAuthStore.getState();
    
    state.logout(authType);
    deleteCookie(`${authType}AccessToken`);
    delete axios.defaults.headers.common["Authorization"];
    clearStore(); 

    if (typeof window !== "undefined") {
        window.location.href = prefix ? `${prefix}/login` : "/";
    }
};

// 1. 인증/로그인 전용 인스턴스
export const authApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_LOGIN_API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// 2. 일반 API 인스턴스
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// 공통 요청 인터셉터 로직 하나로 통합 생성
const requestInterceptor = (config: any) => {
    const authType = getAuthTypeByPath();
    const token = useAuthStore.getState()[authType].accessToken;
    const csrfToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1]
        : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
    return config;
};

api.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
authApi.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));


const handleResponseError = async (error: any, axiosInstance: any) => {
    const originalRequest = error.config;
    const errorResponse = error.response;
    const authType = getAuthTypeByPath();
    const state = useAuthStore.getState();

    if (errorResponse?.status === 401 && errorResponse?.data?.code === "E007") {
        handleDuplicateLogin(errorResponse, state, authType);
        return Promise.reject(error);
    }

    if (errorResponse?.status === 403 || (errorResponse?.status === 500 && originalRequest.url?.includes("/list"))) {
        if (typeof window !== "undefined") {
            window.alert("인증이 만료되었거나 접근 권한이 없습니다. 다시 로그인해주세요.");
            const prefix = authType === "reporter" ? "" : `/${authType}`;
            
            clearAuthSession(authType, prefix); 
        }
        return Promise.reject(error);
    }

    if (originalRequest.url?.includes("api/auth/login") || originalRequest.url?.includes("/refresh")) {
        return Promise.reject(error);
    }
    
    if (errorResponse?.status === 401 && !originalRequest._retry) {

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
            .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true; // 무한 루프 플래그 세팅
        isRefreshing = true;

        try {
            let urlSuffix = authType;
            if (authType === 'pm') urlSuffix = 'pm-corp';
            else if (authType === 'tow') urlSuffix = 'tow-corp';
            else if (authType === 'reporter') urlSuffix = 'report-user';

            console.log(`[TokenRefresh] ${authType} 권한으로 토큰 재발급 요청 시작: /refresh/${urlSuffix}`);

            const response = await authApi.post(`/refresh/${urlSuffix}`); 
            const newAccessToken = response.data.data.accessToken;

            const currentGroup = state[authType];
            const safeUserInfo = currentGroup.userInfo || { name: null, id: null, role: null, bzentyNm: null };

            // Zustand 스토어 업데이트
            if (authType === 'admin') state.setAdminAuth(newAccessToken, safeUserInfo);
            else if (authType === 'pm') state.setPmAuth(newAccessToken, safeUserInfo);
            else if (authType === 'tow') state.setTowAuth(newAccessToken, safeUserInfo);
            else state.setReporterAuth(newAccessToken, safeUserInfo);

            processQueue(null, newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);

            if (typeof window !== "undefined") {
                window.alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                const prefix = authType === "reporter" ? "" : `/${authType}`;
                clearAuthSession(authType, prefix); 
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false; 
        }
    }

    return Promise.reject(error);
};

api.interceptors.response.use((response) => response, (error) => handleResponseError(error, api));
authApi.interceptors.response.use((response) => response, (error) => handleResponseError(error, authApi));

export default api;