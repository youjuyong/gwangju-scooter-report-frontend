import api from "@/services/api";
import {ApiResponse, BusinessInfo, BusinessType, DeviceInfo, ReportStatus} from "@/types/report";
import {apiResolver} from "next/dist/server/api-utils/node/api-resolver";

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
    params: { type: businessType }
  });

  return response.data.data;
};

/**
 * 킥보드 장비 검증
 */
export const getDeviceValid = async (bzeId: string, qrId: string): Promise<ApiResponse<DeviceInfo>> => {
  const response = await api.get<ApiResponse<DeviceInfo>>(`/pm/device/verify`, {
    params: {bzentyId: bzeId, qrcdVl: qrId }
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