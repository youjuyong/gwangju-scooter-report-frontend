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
 * 견인 신고 내역 전체 조회
 * */
export const getTowDclrListApi = async (request: towDcleReportRequestForm, token?: string): Promise<towDcleReportResponse[]> => {
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
 * 회수 완료 처리 /api/dclr/{dclrId}/pm/complete
 * */
export const getTowDclrComplete = async (formData: FormData) => {
    const response = await api.patch(`/dclr/tow/complete`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

// /**
//  * 킥보드 pm 신고 진행 장비 검증
//  */
// export const getReportStatus = async (qrId: string): Promise<ApiResponse<any>> => {
//     const response = await api.get<ApiResponse<any>>(`/pm/device/verify/report-status`, {
//         params: {qrcdVl: qrId}
//     });
//
//     return response.data;
// }

// /**
//  * 소속 업체 배치존 목록 조회(pm용)
//  */
// export const getMyBachList = async (): Promise<ApiResponse<any>> => {
//     const response = await api.get<ApiResponse<any>>(`/pm/bach/my-company`);
//
//     return response.data;
// }
