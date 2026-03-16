import { toast } from 'react-hot-toast';

/**
 * API 에러를 공통으로 처리하는 함수
 * @param err - catch문에서 잡힌 error 객체
 * @param defaultMsg - 서버 메시지가 없을 경우 보여줄 기본 문구
 */
export const handleApiError = (err: any, defaultMsg: string = "오류가 발생했습니다.") => {
  if (err.response && err.response.data) {
    const { message } = err.response.data;
    toast.error(message || defaultMsg);
    console.error("[API Error Response]:", err.response.data);
  } 
  else if (err.request) {
    toast.error("서버 연결이 원활하지 않습니다. 네트워크를 확인해주세요.");
    console.error("[API No Response]:", err.request);
  } 
  else {
    toast.error(defaultMsg);
    console.error("[API Setup Error]:", err.message);
  }
};