import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// 1. Axios 인스턴스 생성
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      // 헤더에 토큰이 있다면 Bearer 토큰 추가
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Authorization = `Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJmY2IyNDYzOC0xZDE0LTQ5YWMtODY5NC05N2Y5ZDViMTJkNmIiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc3MzM2ODY1MCwiZXhwIjoxNzc1OTYwNjUwfQ.hf5PNwqUXmjNZn-twmIJdV3gKlzqdXJdEsNPgGvTLtPxtDcPJvIN0lXIgtnFSBpFf8QQKafpp0BKZFthdiA5tA`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답(Response) 인터셉터 (선택 사항: 토큰 만료 처리)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log(error);
    if (error.response?.status === 401) {
      console.error("인증이 만료되었습니다.");
    }
    return Promise.reject(error);
  }
);

export default api;