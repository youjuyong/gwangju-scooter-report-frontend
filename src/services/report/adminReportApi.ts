import {AdminReportForm,AdminReportResponse} from "@/types/adminReport";
import api from "@/services/api";

const BASE_CODE_URL = '/statistics';

export const getReportListApi = async (request:AdminReportForm) :Promise<AdminReportResponse[]> => {
    const response = await api.get(BASE_CODE_URL+'/history',{
        params: request
    });
    return response.data;
}