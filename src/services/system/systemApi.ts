import api from "@/services/api";
import {ApiResponse} from "@/types/auth";
import {OperationSettingItem, pmResponse, settingResponse, UpdateOperationSettingRequest} from "@/types/system";

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

//==============================================================================================================

/**
 * 운영 설정 전체 목록 조회
 */
export const getOperationSettingListApi = async (): Promise<OperationSettingItem[]> => {
    // 💡 제네릭에 ApiResponse 규격을 명시해 줍니다.
    const response = await api.get<settingResponse<OperationSettingItem[]>>(`/system/operation-setting`);
    return response.data.data;
};

/**
 * 운영 설정 정보 수정 (신고/견인/자동 운영 설정 변경)
 */
export const updateOperationSettingApi = async (
    request: UpdateOperationSettingRequest
): Promise<ApiResponse<null>> => {
    const response = await api.put<ApiResponse<null>>(`/system/operation-setting`, request);
    return response.data;
};

/**
 * 견인 자동 이관 시간 수정 API
 *
 */
export const updateTowingTimeApi = async (payload: { autoTowingTransferTime: number }): Promise<void> => {
    // 프로젝트 내 공통 api 인스턴스 규격에 맞춰 호출 (예시: axios)
    await api.put("/system/operation-setting/towing-time", payload);
};

/**
 * 자동 운영 설정 삭제 API
 */
export const deleteOperationSettingApi = async (payload: { operStngId: string; operCd: string; }): Promise<void> => {
    // Axios 등 공통 인스턴스 규격에 맞춰 호출 (body 데이터를 보낼 땐 { data } 스펙 활용)
    await api.delete("/system/operation-setting", {data: payload});
};