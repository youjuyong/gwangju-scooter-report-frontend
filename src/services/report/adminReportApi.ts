import {
    AdminReportForm,
    AdminReportResponse,
    PrivacyReportForm,
    PrivacyReportResponse,
    UserConnHistroyForm, UserConntHistoryResponse,
    UserHistoryForm,
    UserHistoryResponse
} from "@/types/adminReport";
import api from "@/services/api";

const BASE_CODE_URL = '/statistics';

export const getReportListApi = async (request:AdminReportForm) :Promise<AdminReportResponse[]> => {
    const response = await api.get(BASE_CODE_URL+'/history',{
        params: request
    });
    return response.data;
}

export const getPrivacyReportListApi = async (request:PrivacyReportForm) :Promise<PrivacyReportResponse[]> =>{
    const response = await api.get(BASE_CODE_URL+'/privacy/yearly',{
        params: request
    });
    return response.data;
}

export const getUserHistoryListApi = async (request:UserHistoryForm):Promise<UserHistoryResponse[]> => {
    const response = await api.get(BASE_CODE_URL+'/change',{
        params: request
    });
    return response.data.data;
}

export const UserConntHistoryListApi  = async (request:UserConnHistroyForm):Promise<UserConntHistoryResponse[]> => {
    const response = await api.get(BASE_CODE_URL+'/system/connection',{
        params: request
    });
    return response.data.data;
}

