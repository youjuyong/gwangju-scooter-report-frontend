import {NoticeAddRequestForm, NoticeRequestForm, NoticeResponse, PolicyAddRequestForm} from "@/types/notice";
import api from "@/services/api";

const BASE_CODE_URL = '/ntc';

/**
 * 메인 공지사항
 */
export const getMainNoticeListApi = async (request: NoticeRequestForm): Promise<NoticeResponse[]> => {
    const response = await api.get(BASE_CODE_URL+'/citizen' , {
        params: request
    });
    return response.data.data;
}
/**
 * 운영단말 공지사항
 */
export const getAdminNoticeListApi = async (request: NoticeRequestForm): Promise<NoticeResponse[]> => {
    const response = await api.get(BASE_CODE_URL , {
        params: request
    });
    return response.data.data.content;
}
/**
 * 공지사항 상세
 */
export const getMainNoticeApi = async (ntcId:string ): Promise<NoticeResponse> => {
    const response = await api.get(BASE_CODE_URL +'/'+ ntcId );
    return response.data.data;
}
/**
 * 공지사항 삭제
 */
export const deleteNoticeApi = async (ntcId:string ): Promise<any> => {
    const response = await api.delete(BASE_CODE_URL +'/'+ ntcId );
    return response.data;
}

/**
 * 운영단말 공지사항 수정
 */
export const updateNoticeApi = async (formData: FormData): Promise<NoticeResponse> => {
    const ntcId = formData.get('ntcId') as string;
    const response = await api.put(`${BASE_CODE_URL}/${ntcId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data.data;
};
/**
 * 공지사항 추가
 */
export const addNoticeListApi = async (request: NoticeAddRequestForm): Promise<NoticeResponse[]> => {
    const formData = new FormData();

    // 1. 단일 텍스트 필드들을 킥보드 페이지처럼 각각 주입
    formData.append('ttlNm', request.ttlNm);
    formData.append('cnData', request.cnData);
    formData.append('mainExpsrYn', request.mainExpsrYn || 'N');
    formData.append('ntcTypeCd', request.ntcTypeCd || 'NTCT01' );
    formData.append('exprsYn', request.exprsYn || 'N' );

    if (request.expsrBgngDt) formData.append('expsrBgngDt', request.expsrBgngDt);
    if (request.expsrEndDt) formData.append('expsrEndDt', request.expsrEndDt);

    // 2. 표출 범위 유저 타입 코드 리스트 (배열 처리)
    if (request.userTypeCds && request.userTypeCds.length > 0) {
        request.userTypeCds.forEach((cd) => {
            formData.append('userTypeCds', cd); // 백엔드 스펙에 따라 'userTypeCds[]' 일 수도 있음
        });
    }

    // 3. 🌟 첨부파일 객체 직접 매핑 (킥보드 코드의 formData.append("dclrImages", file1) 방식 반영)
    if (request.noticeFiles && request.noticeFiles.length > 0) {
        request.noticeFiles.forEach((file) => {
            formData.append('noticeFiles', file);
        });
    }

    // 4. Axios 요청 보낼 때 Content-Type은 라이브러리가 바운더리를 자동 생성하도록 명시하지 않거나 멀티파트로 지정
    const response = await api.post(BASE_CODE_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data.data.content;
};
//------------------------------------------------------------------------
/**
 * 공지사항 유형별 조회 (약관 정책)
 */
export const getPolicyApi = async ( ): Promise<any> => {
    const response = await api.get(BASE_CODE_URL +'/type?ntcTypeCd=NTCT02');
    return response.data.data;
}

/**
 * 공지사항 유형별 조회 (약관 정책)
 */
export const updatePolicyApi = async ( request: PolicyAddRequestForm): Promise<any> => {
    const response = await api.post(BASE_CODE_URL +'/terms', request);
    return response.data.data;
}