import api from "@/services/api";
import {
    ApiResponse,
    BusinessInfo,
    BusinessType,
    DeviceInfo,
    towDcleReportRequestForm,
    towDcleReportResponse,
    ReportStatus,
    staffsResponse
} from "@/types/report_tow";

/**
 * 신고내역 단건 조회
 * */
export const getReportDetail = async (dclrId: string) => {
    const response = await api.get<ApiResponse<any>>(`/dclr/${dclrId}`);
    return response.data;
}


/**
 * 견인 신고 내역 전체 조회
 * */
export const getTowDclrListApi = async (request: towDcleReportRequestForm, token?: string): Promise<towDcleReportResponse[]> => {
    const response = await api.get('/dclr/tow/list', {
        params: request,
        headers: token ? {Authorization: `Bearer ${token}`} : undefined
    });
    return response.data.data;
}

/**
 * 처리자 조회
 */
export const getStaffsList = async (): Promise<staffsResponse[]> => {
    const response = await api.get(`/admin/user/tow-staffs`);
    return response.data.data;
};

/**
 * 회수 진행 처리
 * */
export const getTowDclrCollect = async (dclrId: string) => {
    const response = await api.patch(`/dclr/${dclrId}/tow/collect`);
    return response.data;
}

/**
 * 회수 완료 처리
 * */
export const getTowDclrComplete = async (formData: FormData) => {
    const response = await api.patch(`/dclr/tow/complete`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

