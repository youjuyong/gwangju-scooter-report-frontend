import {AlarmResponse, ApiResponse} from "@/types/alarm";
import api from "@/services/api";

const BASE_CODE_URL = '/notification/';


export const getAlarmListApi = async () :Promise<AlarmResponse[]> =>{
    const response = await api.get(BASE_CODE_URL+"/my-logs");
    return response.data.data;

    };

export const UpdateAlarmStatus = async (logId:string)  =>{
    const response = await api.patch<ApiResponse<any>>(BASE_CODE_URL+`/read/${logId}`);
    return response.data;
}