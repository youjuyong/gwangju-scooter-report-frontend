import api from "@/services/api";
import {ApiResponse} from "@/types/auth";
import {pmResponse} from "@/types/system";

/**
 * pm 업체 조회
 * */
export const getPmCompanyListApi = async ():Promise<pmResponse[]> => {
    const response = await api.get(`/pm/admin/pm-companies`);
    return response.data;
}


/**
 * pm 업체 수정
 * */
export const updatePmCompanyApi = async (formData: FormData): Promise<any> => {
    // 💡 POST 메서드로 /pm/pm-companies (또는 지정된 URL) 호출
    const response = await api.post(`/pm/update`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // 파일 전송을 위한 필수 헤더
        },
    });

    // 백엔드 공통 응답 구조가 response.data.data 형태라면 파싱해서 리턴
    return response.data.data || response.data;
};
/**
 * pm 업체 생성
 * */
export const createPmCompanyApi = async (formData: FormData): Promise<any> => {
    // 💡 POST 메서드로 /pm/pm-companies (또는 지정된 URL) 호출
    const response = await api.post(`/pm/register`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // 파일 전송을 위한 필수 헤더
        },
    });

    // 백엔드 공통 응답 구조가 response.data.data 형태라면 파싱해서 리턴
    return response.data.data || response.data;
};