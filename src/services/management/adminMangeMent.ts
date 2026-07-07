import {
    AdminDeptListResponse, BzenDeptListResponse,
    AdminUserInfoForm
} from "@/types/managment";

import api from "@/services/api";

//운영자,관리자 부서 리스트 조회
export const getAdminDeptList = async (typeCd:string) :Promise<AdminDeptListResponse[]> => {
    const response = await api.get(`/code/adminOper/${typeCd}`);
    return response.data.data;
}

//PM,견인 업체별 부서 리스트 조회
export const getBzenDeptList = async (bzentyId:string) :Promise<BzenDeptListResponse[]> => {
    const response = await api.get(`/code/company/${bzentyId}`);
    return response.data.data;
}

// 운영자/관리자 수정
export const updateAdminUser = async (userId: string, param: AdminUserInfoForm): Promise<any> => {
    // userId는 URL 주소에 녹여서 보내고, 데이터 본문(param)은 바디에 담아 보냅니다.
    const response = await api.put(`/admin/user/detail/${userId}`, param);
    return response.data;
};

// 운영자/관리자 등록
export const createAdminUser = async (param: AdminUserInfoForm): Promise<any> => {
    const response = await api.post(`/admin/user/register`, param);
    return response.data;
};

