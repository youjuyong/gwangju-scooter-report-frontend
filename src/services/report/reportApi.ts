import api from "@/services/api";
import {
    ApiResponse,
    BusinessInfo,
    BusinessType,
    DeviceInfo,
    pmDcleReportRequestForm,
    pmDcleReportResponse,
    ReportStatus,
    staffsResponse
} from "@/types/report";

export const updateReportStatus = async (reportId: number, status: ReportStatus) => {
    const response = await api.patch<ApiResponse<any>>(`/report/${reportId}/status`, {
        reportStatus: status
    });
    return response.data;
};

/**
 * 업체 유형별 리스트 조회
 */
export const getBusinessList = async (businessType: BusinessType): Promise<BusinessInfo[]> => {
    const response = await api.get<ApiResponse<BusinessInfo[]>>(`/bzenty/list`, {
        params: {type: businessType}
    });

    return response.data.data;
};

/**
 * 킥보드 장비 검증
 */
export const getDeviceValid = async (bzeId: string, qrId: string): Promise<ApiResponse<DeviceInfo>> => {
    const response = await api.get<ApiResponse<DeviceInfo>>(`/pm/device/verify`, {
        params: {bzentyId: bzeId, qrcdVl: qrId}
    });

    return response.data;
}

/**
 * 신고하기
 */
export const registerReport = async (formData: FormData) => {
    const response = await api.post<ApiResponse<any>>(`/dclr/register`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * 본인 신고 내역 전체 조회
 */
export const getReportList = async () => {
    const response = await api.get<ApiResponse<any>>(`/dclr/my-list`);
    return response.data;
};

/**
 * 신고내역 단건 조회
 * */
export const getReportDetail = async (dclrId: string) => {
    const response = await api.get<ApiResponse<any>>(`/dclr/${dclrId}`);
    return response.data;
}

/**
 * pm 신고 내역 전체 조회
 * */
export const getPmDclrListApi = async (request: pmDcleReportRequestForm, token?: string): Promise<pmDcleReportResponse[]> => {
    const response = await api.get('/dclr/pm/list', {
        params: request,
        headers: token ? {Authorization: `Bearer ${token}`} : undefined
    });
    return response.data.data;
}

/**
 * 처리자 조회
 */
export const getStaffsList = async (): Promise<staffsResponse[]> => {
    const response = await api.get(`/admin/user/pm-staffs`);
    return response.data.data;
};

/**
 * 회수 진행 처리
 * */
export const getPmDclrCollect = async (dclrId: string) => {
    const response = await api.patch(`/dclr/${dclrId}/pm/collect`);
    return response.data;
}

/**
 * 회수 완료 처리 /api/dclr/{dclrId}/pm/complete
 * */
export const getPmDclrComplete = async (formData: FormData) => {
    const response = await api.patch(`/dclr/pm/complete`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

/**
 * 킥보드 pm 신고 진행 장비 검증
 */
export const getReportStatus = async (qrId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/pm/device/verify/report-status`, {
        params: {qrcdVl: qrId}
    });

    return response.data;
}