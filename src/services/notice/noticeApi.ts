import {NoticeRequestForm, NoticeResponse} from "@/types/notice";
import api from "@/services/api";

const BASE_CODE_URL = '/ntc';

/**
 * 메인 공지사항
 */
export const getMainNoticeListApi = async (request: NoticeRequestForm): Promise<NoticeResponse[]> => {
    const response = await api.get(BASE_CODE_URL , {
        params: request
    });
    return response.data.data.content;
}
/**
 * 공지사항 상세
 */
export const getMainNoticeApi = async (ntcId:string ): Promise<NoticeResponse[]> => {
    const response = await api.get(BASE_CODE_URL + ntcId );
    return response.data.data.content;
}