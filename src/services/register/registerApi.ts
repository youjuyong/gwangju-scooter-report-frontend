import api, {authApi} from "../api";
import {deptResponse, roleResponse, signUpRequest, signUpResponse,} from "@/types/regiser";


const BASE_CODE_URL = '/code';
const BASE_DEPT_URL = '/admin/user/dept';

/**
 * 회원가입 권한 선택박스 조회
 */
export const getRegisterRoleApi = async (): Promise<roleResponse[]> => {
    const response = await api.get(BASE_CODE_URL + '/DPTY');
    return response.data.data;
}

/**
 * 회원가입시 role해당 부서 조회
 */
export const getDeptApi = async ( deptTypeCode: string): Promise<deptResponse[]> => {
    const response = await api.get(BASE_DEPT_URL+'/'+deptTypeCode);
    return response.data.data;
}

/**
 * 회원가입
 */
export const signUpApi = async (request: signUpRequest): Promise<signUpResponse> => {
    const response = await authApi.post('/api-auth/admin/signup', request);
    return response.data;
}