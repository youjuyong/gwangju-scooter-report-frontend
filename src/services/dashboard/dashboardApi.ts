import api from "@/services/api";

/**
 * 대시보드 목록조회
 */
export const getDashboardList = async (token?: string) => {
    const response = await api.get('/dclr/dashboard/list', {
        headers: token ? {Authorization: `Bearer ${token}`} : undefined
    });
    return response.data;
}

/**
 * 자동/수동 승인 상태 조회
 */
export const getAutoApprove = async () => {
    const response = await api.get('/system/auto-approve');
    return response.data;
}

/**
 * 자동/수동 승인 상태 업데이트
 */
export const patchAutoApprove = async (isManual: boolean) => {
    const value = isManual ? "N" : "Y";

    const response = await api.patch('/system/auto-approve', {paramVl: value});
    return response.data;
}