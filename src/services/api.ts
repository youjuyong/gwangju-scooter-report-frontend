import axios from 'axios';
import {useAuthStore} from '@/store/authStore';

// CSRF 및 기본 설정 전역 적용
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

let isRefreshing = false;
let failedQueue: any[] = [];

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

// 1. 인증/로그인 전용 인스턴스
export const authApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_LOGIN_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// 2. 일반 API 인스턴스
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// 1. 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

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
        const token = useAuthStore.getState().accessToken;
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

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
        
        if (errorResponse?.status === 401 && errorResponse?.data?.code === "E007") {
            useAuthStore.getState().clearAuth();
            alert("다른 기기에서 로그인되어 연결이 종료되었습니다.");
            return Promise.reject(error);
        }

        if (originalRequest.url?.includes("api/auth/login")) {
            return Promise.reject(error);
        }

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
                // // const response = await axios.post(
                // //     `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                // //     {},
                // //     {withCredentials: true}
                // // );

                // // const newAccessToken = response.data.data.accessToken;

                // useAuthStore.getState().setAccessToken(newAccessToken);
                // originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // processQueue(null, newAccessToken);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().setAccessToken(null);
                useAuthStore.getState().setRole(null);

                // 쿠키 삭제 및 홈 이동 로직 (window.location.href 사용 추천)
                if (typeof window !== "undefined") {
                //    window.location.href = "/";
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