import api from "@/services/api";
import {ApiResponse} from "@/types/auth";
import {
    codeCreateRequest,
    codeResponse, codeUpdateRequest,
    OperationSettingItem,
    pmResponse,
    settingResponse,
    UpdateOperationSettingRequest
} from "@/types/system";

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
    // POST 메서드로 /pm/pm-companies (또는 지정된 URL) 호출
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
    // POST 메서드로 /pm/pm-companies (또는 지정된 URL) 호출
    const response = await api.post(`/pm/register`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // 파일 전송을 위한 필수 헤더
        },
    });

    // 백엔드 공통 응답 구조가 response.data.data 형태라면 파싱해서 리턴
    return response.data.data || response.data;
};
/**
 * pm 업체 삭제 (DELETE 방식)
 * */
export const deletePmCompanyApi = async (bzentyId: string | number): Promise<any> => {
    const response = await api.delete(`/pm/${bzentyId}`);
    return response.data.data || response.data;
};

//운영 설정==============================================================================================================

/**
 * 운영 설정 전체 목록 조회
 */
export const getOperationSettingListApi = async (): Promise<OperationSettingItem[]> => {
    // 제네릭에 ApiResponse 규격을 명시해 줍니다.
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

//배치-----------------------------------------------------------------------------
/**
 * 전체 업체 배치존 목록 조회
 * GET /api/pm/bach/all
 */
export const getBatchPointListApi = async (): Promise<any[]> => {
    // 백엔드 공통 응답 포맷(ApiResponse)이 있다면 .get<ApiResponse<any[]>> 형태로 타입을 지정해 주세요.
    const response = await api.get(`/pm/bach/all`);
    return response.data.data || response.data;
};

/**
 * 배치 포인트 신규 등록
 * POST /api/pm/bach
 */
export const createBatchPointApi = async (payload: any): Promise<any> => {
    const response = await api.post(`/pm/bach`, payload);
    return response.data.data || response.data;
};

/**
 * 배치 포인트 수정
 * PUT /api/pm/bach
 */
export const updateBatchPointApi = async (payload: any): Promise<any> => {
    const response = await api.put(`/pm/bach`, payload);
    return response.data.data || response.data;
};

/**
 * 배치 포인트 삭제
 */
export const deleteBatchPointApi = async (btchZoneId: string | number): Promise<void> => {
    await api.delete(`/pm/bach/${btchZoneId}`);
};

//========================================================================================
/**
 * 권역 계층 구조 조회 (Hierarchy)
 * @description 대시보드 및 필터 링에서 사용하는 시도/구군/동 단위 계층 구조 데이터 가져오기
 * */
export const getSystemHierarchyApi = async (): Promise<any> => {
    const response = await api.get(`/system/hierarchy`);
    return response.data.data || response.data;
};

/**
 * 권역 신규 등록
 */
export const createSareaApi = async (payload: {
    upSareaId: number;
    sareaId: number;
    sareaNm : string;
}): Promise<any> => {
    const response = await api.post(`/system/sarea`, payload);
    return response.data.data || response.data;
};

/**
 * 권역 정보 수정
 */
export const updateSareaApi = async (payload: {
    sareaId: number;
    upSareaId: number;
    sareaTypeCd: string;
    sareaNm : string;
}): Promise<any> => {
    const response = await api.put(`/system/sarea`, payload);
    return response.data.data || response.data;
};

/**
 * 권역 정보 삭제 (Query Parameter 방식)
 */
export const deleteSareaApi = async (payload: {
    upSareaId: string | number;
    sareaId: string | number;
}): Promise<any> => {
    // 쿼리 파라미터 규격에 맞게 params 객체로 전달합니다.
    const response = await api.delete(`/system/sarea`, {
        params: payload
    });
    return response.data.data || response.data;
};

//================================================================================
/**
 * 1. 공통 상세 코드 등록 (POST)
 * @param clsfCd 분류 코드
 * @param data 등록할 코드 정보
 */
export const createCodeDetailApi = async (clsfCd: string, data: codeCreateRequest): Promise<codeResponse> => {
    const response = await api.post(`/code/${clsfCd}/details`, data);
    return response.data;
};

/**
 * 2. 공통 상세 코드 수정 (PUT)
 * @param clsfCd 분류 코드
 * @param cdId 코드 ID
 * @param data 수정할 코드 정보
 */
export const updateCodeDetailApi = async (clsfCd: string, cdId: string, data: codeUpdateRequest): Promise<codeResponse> => {
    const response = await api.put(`/code/${clsfCd}/details/${cdId}`, data);
    return response.data;
};

/**
 * 3. 공통 상세 코드 삭제 (DELETE)
 * @param clsfCd 분류 코드
 * @param cdId 코드 ID
 */
export const deleteCodeDetailApi = async (clsfCd: string, cdId: string): Promise<{ message: string } | void> => {
    const response = await api.delete(`/code/${clsfCd}/details/${cdId}`);
    return response.data;
};

/**
 * 5. 사용 가능한 공통코드 전체 목록 조회 (GET)
 * (이전 턴에서 작성한 함수입니다.)
 */
export const getActiveCodeListApi = async (): Promise<codeResponse[]> => {
    const response = await api.get(`/code/active`);
    return response.data;
};
