import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // .env 파일에 서버 주소 입력
  headers: {
    'Content-Type': 'application/json',
  },
});

export const axiosPost = async (url: string, data: any) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    throw error; // 에러는 호출하는 곳에서 처리하도록 던집니다.
  }
};