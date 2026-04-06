import api from "@/services/api";
import { ApiResponse, ReportStatus } from "@/types/report";

export const updateReportStatus = async (reportId: number, status: ReportStatus) => {
  const response = await api.patch<ApiResponse<any>>(`/report/${reportId}/status`, {
    reportStatus: status
  });
  return response.data;
};