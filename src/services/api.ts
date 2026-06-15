import axios from 'axios';
import {useAuthStore} from '@/store/authStore';
import { MemberRole } from '@/store/authStore';
import {deleteCookie} from "cookies-next";
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
    if (typeof window === 'undefined') return 'reporter'; // SSR 환경 대비
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/pm')) return 'pm';
    if (path.startsWith('/tow')) return 'tow';
    return 'reporter'; // 기본값
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


const clearAuthSession = (authType:any, prefix:any) => {
    const { clearStore } = useAlarmStore.getState(); 
    
    const state = useAuthStore.getState();
    state.logout(authType);

    deleteCookie(`${authType}AccessToken`);

    delete axios.defaults.headers.common["Authorization"];
    
    clearStore(); 

    if (typeof window !== "undefined") {
        if (prefix) {
            window.location.href = `${prefix}/login`;
        } else {
            window.location.href = "/";
        }
    }
};

// 1. 인증/로그인 전용 인스턴스
export const authApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_LOGIN_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// 2. 일반 API 인스턴스
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// 1. 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        console.log(config);
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
    },
    (error) => Promise.reject(error)
);

authApi.interceptors.request.use(
    (config) => {
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
    },
    (error) => Promise.reject(error)
);


// 2. 응답 인터셉터
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const errorResponse = error.response;
        const authType = getAuthTypeByPath();
        const state = useAuthStore.getState();
       
        // 중복 로그인 처리
        if (errorResponse?.status === 401 && errorResponse?.data?.code === "E007") {
            handleDuplicateLogin(errorResponse, state, authType);
            return Promise.reject(error);
        }

        if (originalRequest.url?.includes("api/auth/login")) {
            return Promise.reject(error);
        }
        
        // 토큰 재발급
        if (error.response?.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({resolve, reject});
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true; // 무한 루프 방지용 플래그
            isRefreshing = true;

            try {
                const response = await authApi.post("/refresh");
 
                const newAccessToken = response.data.data.accessToken;

                const currentGroup = state[authType];

                //  userInfo가 null일 경우를 대비해 기본 객체({ name: null, id: null, role: null })를 병합
                const safeUserInfo = currentGroup.userInfo || { name: null, id: null, role: null, bzentyNm: null };

                if (authType === 'admin') state.setAdminAuth(newAccessToken, safeUserInfo);
                else if (authType === 'pm') state.setPmAuth(newAccessToken, safeUserInfo);
                else if (authType === 'tow') state.setTowAuth(newAccessToken, safeUserInfo);
                else state.setReporterAuth(newAccessToken, safeUserInfo);

                processQueue(null, newAccessToken);

                return api(originalRequest);
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
    }
);

export default api;