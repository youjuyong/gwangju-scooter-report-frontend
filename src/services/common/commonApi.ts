import api from "@/services/api";

/**
 * 코드 분류별 코드 리스트 조회
 */
export const getCodeType = async (code: string) => {
    const response = await api.get(`/code/${code}`);

    return response.data;
};