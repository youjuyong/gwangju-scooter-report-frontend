import {AlarmResponse, ApiResponse} from "@/types/alarm";
import api from "@/services/api";

const BASE_CODE_URL = '/notification/';

//알람 목록 조회
export const getAlarmListApi = async () :Promise<AlarmResponse[]> =>{
    const response = await api.get(BASE_CODE_URL+"my-logs");
    return response.data.data;

    };

//알림 읽음 처리
export const UpdateAlarmStatus = async (logId:string)  =>{
    const response = await api.patch<ApiResponse<any>>(BASE_CODE_URL+`read/${logId}`);
    return response.data;
}

//모든 알림 읽음 처리
export const readAllNotifications = async () =>{
    const response = await api.patch<ApiResponse<any>>(BASE_CODE_URL+"read/all");
    return response.data;
}