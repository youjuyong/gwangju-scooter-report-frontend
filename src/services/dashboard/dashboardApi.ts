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

/**
 * 관리자-신고 대기승인 처리
 */
export const approveDclr = async (dclrId: string) => {
    const response = await api.patch(`/dclr/${dclrId}/collect-request`);
    return response.data;
}

/**
 * 관리자-신고 반려 처리
 */
export const rejectDclr = async (dclrId: string) => {
    const response = await api.patch(`/dclr/${dclrId}/reject`);
    return response.data;
}

/**
 * 관리자-견인 신고 대기승인 처리
 */
export const approveTowDclr = async (dclrId: string) => {
    const response = await api.patch(`/dclr/${dclrId}/tow/collect-request`);
    return response.data;
}